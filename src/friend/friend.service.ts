import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IParticipant, IUserCreated, Pagination } from 'src/ultils/interface';
import { IFriend } from '../ultils/interface/friend.interface';
import { AuthRepository } from '../auth/repository/auth.repository';
import { FriendRepository } from './repository/friend.repository';
import { convertUserToFriend, getUsername } from '../ultils';
import { NotifyService } from '../notify/notify.service';
import { NotifyType } from '../ultils/constant/notify.constant';
import { RedisService } from '../redis/redis.service';
import { ProfileRepository } from '../profile/repository/profile.repository';
import { FriendRequestRepository } from './repository/friend.request.repository';
import { FriendStatus, Services } from '../ultils/constant';
import { IGatewaySessionManager } from '../gateway/gateway.sesstion';
import { DataCreateNotify } from 'src/notify/notify.dto';

@Injectable()
export class FriendService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly friendRepository: FriendRepository,
    private readonly friendRequestRepository: FriendRequestRepository,
    private readonly notifyService: NotifyService,
    private readonly redisService: RedisService,
    private readonly profileRepository: ProfileRepository,
    @Inject(Services.GATEWAY_SESSION_MANAGER)
    private readonly gatewaySession: IGatewaySessionManager,
  ) {}

  async statusFriend(user: IUserCreated, friendId: string) {
    const foundUserFriend = await this.authRepository.findById(friendId);
    if (!foundUserFriend)
      throw new HttpException('User not foud', HttpStatus.BAD_REQUEST);

    if (friendId === user._id) {
      return;
    }

    const isFriend = await this.friendRepository.isFriend(user._id, friendId);
    const responseData = {
      isFriend: isFriend ? true : false,
      isWaitConfirm: false,
      isConfirm: false,
    };

    // Check user or friend have send any request add friend or not
    if (!isFriend) {
      const foundRequest = await this.friendRequestRepository.findById(
        user._id,
        friendId,
      );
      // If not have any request add friend then return false
      if (!foundRequest) return responseData;

      if (foundRequest.sender._id.toString() === user._id) {
        responseData.isWaitConfirm = true;
        return responseData;
      } else {
        responseData.isConfirm = true;
        return responseData;
      }
    } else return responseData;
  }

  // The action of the user who make add friends
  async addFriend(user: IUserCreated, friendId: string) {
    if (friendId === user._id)
      throw new HttpException("Can't not add yourself!", HttpStatus.CONFLICT);

    // Check user add friend exist
    const foundFriendProfile = await this.profileRepository.findByUserId(
      friendId,
    );

    if (!foundFriendProfile)
      throw new HttpException('User not found!', HttpStatus.NOT_FOUND);
    if (foundFriendProfile.profile_total_friends >= 1000)
      throw new HttpException(
        `Can't not request, because ${getUsername(
          foundFriendProfile.profile_user,
        )} already have maximum friends!`,
        HttpStatus.NOT_FOUND,
      );

    const foundMyProfile = await this.profileRepository.findByUserId(friendId);
    if (foundMyProfile.profile_total_friends >= 1000)
      throw new HttpException(
        `Can't not request, because you already have maximum friends!`,
        HttpStatus.NOT_FOUND,
      );

    // Check have friend or not
    const foundRequest = await this.friendRequestRepository.findById(
      user._id,
      friendId,
    );
    if (foundRequest)
      throw new HttpException('Found request!', HttpStatus.NOT_FOUND);

    // Create notify
    const userNotify = {
      userId: user._id,
      userName: getUsername(user),
      avatarUrl: user.avatarUrl,
    };
    const data = {
      notifyType: NotifyType.ADD_FRIEND,
      ownerNotify: { userId: friendId },
      notify_friend: convertUserToFriend(user),
      notifyLink: null,
      post: null,
    };
    const notify = await this.notifyService.createNotify(userNotify, data);
    if (!notify)
      throw new HttpException(
        'Server Error!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    // Add Friend
    return {
      data: await this.friendRequestRepository.addFriend(user._id, friendId),
      notify,
    };
  }

  // The action of user received request add friend
  async confirmFriend(user: IUserCreated, friendId: string) {
    const foundUser = await this.authRepository.findById(friendId);
    if (!foundUser)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const foundRequest = await this.friendRequestRepository.findById(
      user._id,
      friendId,
    );
    if (!foundRequest)
      throw new HttpException('Request not found', HttpStatus.BAD_REQUEST);

    // Create new Friend
    await this.friendRepository.confirmFriend(user._id, friendId);

    // Delete older Notify
    this.notifyService.deleteNotifyAddFriend(user._id, friendId);

    this.changeQuantityFriend(user._id, friendId);

    // Delete Friend Request;
    this.friendRequestRepository.refuseFriend(user._id, friendId);

    // Create new notify
    const notifyData: DataCreateNotify = {
      notifyType: NotifyType.CONFIRM_FRIEND,
      ownerNotify: { userId: friendId },
      notify_friend: convertUserToFriend(foundUser),
      notifyLink: undefined,
      post: undefined,
    };
    const notify = await this.notifyService.createNotify(
      {
        userId: user._id,
        userName: getUsername(user),
        avatarUrl: user.avatarUrl,
      },
      notifyData,
    );

    return {
      friendData: foundUser,
      notify,
    };
  }

  // The action of user received request add friend
  // Refuse request add friend
  async refuseFriend(userId: string, friendId: string) {
    const foundFriend = await this.authRepository.findById(friendId);
    if (!foundFriend)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const foundRequest = await this.friendRequestRepository.findById(
      userId,
      friendId,
    );
    if (!foundRequest)
      throw new HttpException('Request not found', HttpStatus.BAD_REQUEST);

    await this.friendRequestRepository.refuseFriend(userId, friendId);

    // Delete Notify
    this.notifyService.deleteNotifyAddFriend(userId, friendId);

    return 'Refuse friend successfully!';
  }

  // Delete friend
  async deleteFriend(userId: string, friendId: string) {
    const isFriend = await this.friendRepository.isFriend(userId, friendId);
    if (!isFriend) return;

    // Update quantity Friend
    this.changeQuantityFriend(userId, friendId, 'decre');

    return await this.friendRepository.deleteFriend(userId, friendId);
  }

  async findFriend(
    user: IUserCreated,
    keyword: string,
    pagination: Pagination,
  ) {
    return {
      friends: await this.friendRepository.findByName(
        user._id,
        keyword,
        pagination,
      ),
      keyword,
    };
  }

  async getFriends(userId: string) {
    const key = `friends:${userId}`;
    let friends = null;
    // Check catch
    if (await this.redisService.has(key)) {
      const friendJson = await this.redisService.get(key);
      friends = JSON.parse(friendJson);
      return friends;
    }
    friends = await this.friendRepository.findFriendsV2(userId);
    // Set catch
    await this.redisService.set(key, JSON.stringify(friends), 600);
    return friends;
  }

  async findPendingFriends(userId: string, pagination: Pagination) {
    return await this.friendRequestRepository.findPendingFriendsV2(
      userId,
      pagination,
    );
  }

  async findAccepFriends(userId: string, pagination: Pagination) {
    return await this.friendRequestRepository.findAccepFriends(
      userId,
      pagination,
    );
  }

  async findMutualFriends(
    user: IUserCreated,
    friendId: string,
    pagination: Pagination,
  ) {
    if (user._id === friendId)
      throw new HttpException(
        "Can't not get mutual friend with yourself!",
        HttpStatus.BAD_REQUEST,
      );
    // Check catch
    await Promise.all([
      this.getFriendIds(friendId),
      this.getFriendIds(user._id),
    ]);

    const key1 = `friendIds:${friendId}`;
    const key2 = `friendIds:${user._id}`;
    const mutualIds = await this.redisService.sInter(key1, key2);

    if (!mutualIds) {
      return {
        quantity: 0,
        mutualFriends: null,
      };
    } else {
      const mutualFriends = await this.authRepository.findUserFromIds(
        mutualIds,
      );
      return {
        quantity: mutualIds.length,
        mutualFriends,
      };
    }
  }

  async changeQuantityFriend(userId: string, friendId: string, type = 'incre') {
    if (type === 'incre') {
      this.profileRepository.increQuantityFriend(userId, 1);
      this.profileRepository.increQuantityFriend(friendId, 1);
    } else {
      this.profileRepository.increQuantityFriend(userId, -1);
      this.profileRepository.increQuantityFriend(friendId, -1);
    }
  }

  async getFriendOnlineAndOffline(userId: string) {
    const friends = await this.friendRepository.findFriendsV2(userId);
    let onlineFriends = [],
      offlineFriends = [];
    for (let friend of friends) {
      if (this.gatewaySession.getUserSocket(friend._id.toString())) {
        onlineFriends.push(friend);
      } else {
        offlineFriends.push(friend);
      }
    }
    const responseData = {
      onlineFriends,
      offlineFriends,
    };
    // const key = `friend:online:user:${userId}`;
    // this.redisService.set(key, JSON.stringify(responseData), 300);
    return responseData;
  }

  async findFriendOnlineOfflineByName(
    user: IUserCreated,
    keyword: string,
    pagination: Pagination,
  ) {
    const { friends } = await this.findFriend(user, keyword, pagination);

    let onlineFriends = [],
      offlineFriends = [];
    for (let friend of friends) {
      if (this.gatewaySession.getUserSocket(friend._id.toString())) {
        onlineFriends.push(friend);
      } else {
        offlineFriends.push(friend);
      }
    }

    const responseData = {
      onlineFriends,
      offlineFriends,
    };

    return responseData;
  }

  // Bug
  async getFriendIds(userId: string) {
    const key1 = `friendIds:${userId}`;

    if (!(await this.redisService.has(key1))) {
      const friends1 = await this.friendRepository.findFriendIds(userId);
      if (!friends1[0])
        throw new HttpException('Error', HttpStatus.INTERNAL_SERVER_ERROR);
      const friendIds = friends1[0].friendIds;
      await this.redisService.sAdd(key1, friendIds, 600);
    }
  }

  async test(userId: string) {
    return await this.friendRepository.findFriendIds(userId);
  }
}
