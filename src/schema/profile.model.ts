import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Address } from './address.model';
import { IAddress, IUserCreated } from '../ultils/interface';
import { User } from './user.model';

@Schema({ collection: 'Profile', timestamps: true })
export class Profile {
  @Prop({ type: Types.ObjectId, ref: User.name, unique: true })
  profile_user: IUserCreated;

  @Prop({
    default: 0,
    validator: (value: number) => value >= 0 && value <= 1000,
  })
  profile_total_friends: number;

  @Prop({ default: 0 })
  profile_viewer: number;

  @Prop({ default: 0 })
  profile_total_post: number;

  @Prop({ default: 'Student' })
  profile_job: string;

  @Prop({ type: Types.ObjectId, ref: Address.name, unique: true })
  profile_address: IAddress;

  @Prop({ default: 'default' })
  profile_social_github: string;

  @Prop({ default: 'default' })
  profile_social_facebook: string;

  @Prop({
    default:
      'https://source.unsplash.com/1600x900/?nature,photography,technology',
  })
  profile_banner: string;
}
const ProfileSchema = SchemaFactory.createForClass(Profile);

export const ProfileModel = {
  name: Profile.name,
  schema: ProfileSchema,
};
