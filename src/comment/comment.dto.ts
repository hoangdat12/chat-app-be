import { IsNotEmpty } from 'class-validator';

export class DataCreateComment {
  @IsNotEmpty()
  comment_post_id: string;
  @IsNotEmpty()
  comment_content: string;
  @IsNotEmpty()
  comment_type: string;
  // @IsNotEmpty()
  comment_parent_id: string | null;
}

export class DataDeleteComment {
  @IsNotEmpty()
  comment_post_id: string;
  comment_id?: string;
}

export class DataUpdateComment extends DataDeleteComment {
  @IsNotEmpty()
  comment_content: string;
}
