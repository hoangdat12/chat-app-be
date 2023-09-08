import { IsNotEmpty } from 'class-validator';
import { IFriend, IPost } from '../ultils/interface';

export class DataCreatePost {
  post_content: string;
  @IsNotEmpty()
  post_type: string;
  @IsNotEmpty()
  post_mode: string;
  post_share: IPost | null;
  post_tag?: IFriend[];
}

export class IDataUpdatePost {
  post_image: string;
  post_content: string;
}
