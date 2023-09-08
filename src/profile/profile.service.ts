import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ProfileRepository } from './repository/profile.repository';
import { AuthRepository } from '../auth/repository/auth.repository';
import { IUserCreated } from 'src/ultils/interface';
import {
  DataUpdateAddress,
  DataUpdateInformationUser,
  IDataChangeSocialLink,
} from './profile.dto';
import { AddressRepository } from './repository/address.repository';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly addressRepository: AddressRepository,
    private readonly userRepository: AuthRepository,
    private readonly redisService: RedisService,
  ) {}

  async createProfile(userId: string) {
    const address = await this.addressRepository.create(userId);
    await this.profileRepository.createProfile(userId, address._id.toString());
  }

  async viewProfile(user: IUserCreated, userId: string) {
    if (user._id !== userId) {
      const key = `user:${user._id}:profile:${userId}`;
      // If haven't key then increment view profile
      if (!(await this.redisService.get(key))) {
        // Set key
        await this.redisService.set(key, 'view');
        // increment
        this.profileRepository.increViewProfile(userId);
      }
    }
    const foundProfile = await this.profileRepository.findByUserId(userId);
    if (!foundProfile)
      throw new HttpException('User not found!', HttpStatus.NOT_FOUND);

    return foundProfile;
  }

  async updateSocialLink(user: IUserCreated, data: IDataChangeSocialLink) {
    let { type, social_link } = data;
    social_link = social_link.trim();
    if (type !== 'Facebook' && type !== 'Github')
      throw new HttpException('Not valid type!', HttpStatus.BAD_REQUEST);

    if (!social_link.startsWith('https://'))
      throw new HttpException('Not valid link', HttpStatus.BAD_REQUEST);

    const foundProfile = await this.profileRepository.findByUserId(user._id);
    if (!foundProfile)
      throw new HttpException('User not found!', HttpStatus.BAD_REQUEST);

    switch (type) {
      case 'Facebook':
        foundProfile.profile_social_facebook = social_link;
        break;
      case 'Github':
        foundProfile.profile_social_github = social_link;
        break;
      default:
        throw new HttpException('Invalid Type', HttpStatus.BAD_REQUEST);
    }

    await foundProfile.save();

    return { type, social_link };
  }

  async changeUserInformation(
    user: IUserCreated,
    data: DataUpdateInformationUser,
  ) {
    let { firstName, lastName, job } = data;
    firstName = firstName.trim();
    lastName = lastName.trim();
    job = job.trim();

    let condition =
      firstName === null &&
      lastName === null &&
      job === null &&
      (firstName === '' || lastName !== '' || job !== '');

    if (condition)
      throw new HttpException('Invalid Value!', HttpStatus.BAD_REQUEST);

    const foundProfile = await this.profileRepository.findByUserId(user._id);
    if (!foundProfile)
      throw new HttpException('User not found!', HttpStatus.BAD_REQUEST);

    const foundUser = await this.userRepository.findById(user._id);
    if (!foundUser)
      throw new HttpException('User not found!', HttpStatus.BAD_REQUEST);

    foundProfile.profile_job = job;
    const updateNameUserPromise = this.userRepository.updateUserName(
      user._id,
      firstName,
      lastName,
    );
    const saveData = foundProfile.save();
    await Promise.all([saveData, updateNameUserPromise]);

    return { firstName, lastName, job };
  }

  async updateAddress(user: IUserCreated, data: DataUpdateAddress) {
    const {
      address_city,
      address_country,
      address_postal_code,
      address_state,
      address_street,
    } = data;

    const foundUser = await this.userRepository.findById(user._id);
    if (!foundUser)
      throw new HttpException('User not found!', HttpStatus.BAD_REQUEST);

    const foundAddress = await this.addressRepository.findByUserId(user._id);
    if (!foundAddress)
      throw new HttpException('User address not found', HttpStatus.CONFLICT);

    foundAddress.address_city = address_city;
    foundAddress.address_country = address_country;
    foundAddress.address_postal_code = address_postal_code;
    foundAddress.address_state = address_state;
    foundAddress.address_street = address_street;

    await foundAddress.save();

    return data;
  }

  async createProfileFixBug() {
    const users = await this.userRepository.findAll();
    for (let user of users) {
      const address = await this.addressRepository.create(user._id.toString());
      await this.profileRepository.createProfile(
        user._id.toString(),
        address._id.toString(),
      );
    }
    return { msg: true };
  }
}
