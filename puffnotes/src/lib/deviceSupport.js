export const isMobileDevice = ({
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
  mobile = typeof navigator === 'undefined' ? false : navigator.userAgentData?.mobile,
  maxTouchPoints = typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints,
} = {}) => Boolean(mobile)
  || /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)
  || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);

export const isPhoneDevice = ({
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
  mobile = typeof navigator === 'undefined' ? false : navigator.userAgentData?.mobile,
} = {}) => Boolean(mobile)
  || /iPhone|iPod|Windows Phone|Android.+Mobile|Mobile.+Android/i.test(userAgent);

export const supportsOfflineMode = ({
  mobile = isMobileDevice(),
  hasDirectoryPicker = typeof window !== 'undefined' && 'showDirectoryPicker' in window,
} = {}) => !mobile && hasDirectoryPicker;
