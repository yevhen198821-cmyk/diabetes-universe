import { profilePageBackgroundClassName } from './profile-surface-styles';

export function ProfilePageBackground() {
  return <div aria-hidden="true" className={profilePageBackgroundClassName} />;
}

export {
  profileCardClassName,
  profileMainContainerClassName,
  profilePageShellClassName,
} from './profile-surface-styles';
