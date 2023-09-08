export enum SocketCall {
  ON_AUDIO_CALL_REQUEST = 'onAudioCallRequest',
  ON_VIDEO_CALL_REQUEST = 'onVideoCallRequest',
  VIDEO_CALL_ACCEPTED = 'onSocketVideoCallAccepted',
  VIDEO_CALL_REJECTED = 'onSocketVideoCallRejected',
  VOICE_CALL_ACCEPTED = 'onSocketVoiceCallAccepted',
  VOICE_CALL_REJECTED = 'onSocketVoiceCallRejected',
  VIDEO_CALL_CLOSE = 'onVideoCallClose',
  VOICE_CALL_CLOSE = 'onVoiceCallClose',
  SENDER_REJECT_CALL = 'onSockerSenderRejectCall',
}

export enum WebsocketEvents {
  ON_VIDEO_CALL_ACCEPT = 'onVideoCallAccept',
  ON_VOICE_CALL_ACCEPT = 'onVideoCallReject',
  ON_VIDEO_CALL_REJECT = 'onVoiceCallAccept',
  ON_VOICE_CALL_REJECT = 'onVoiceCallReject',
  ON_VIDEO_CALL = 'onVideoCall',
  ON_VOICE_CALL = 'onVoiceCall',
  ON_VIDEO_CLOSE = 'onVideoClose',
  ON_VOICE_CLOSE = 'onVoiceClose',
  ON_SENDER_REJECT_CALL = 'onSenderRejectCall',
}
