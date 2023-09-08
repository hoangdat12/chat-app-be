import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from './user.model';

export type KeyTokenDocument = mongoose.Document & KeyToken;

@Schema({ collection: 'KeyToken', timestamps: true })
export class KeyToken {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;

  @Prop({ required: true })
  privateKey: string;

  @Prop({ required: true })
  publicKey: string;

  @Prop({ default: [] })
  refreshTokenUsed: string[];

  @Prop()
  refreshToken: string;
}

export const KeyTokenSchema = SchemaFactory.createForClass(KeyToken);
export const KeyTokenModel = { name: KeyToken.name, schema: KeyTokenSchema };
