// Installation observations are not a claim that an app is still installed after a possible uninstall.
export type InstallEvidence = '' | 'native' | 'standalone';
export const INSTALL_CONFIRMATION_KEY = 'sv2_install_confirmation';
export const INSTALL_REMINDER_HIDDEN_KEY = 'sv2_install_reminder_hidden';
export const installEvidence = (value: unknown, standalone = false): InstallEvidence => standalone ? 'standalone' : value === 'native' || value === 'standalone' ? value : '';
export const combineInstallEvidence = (previous: unknown, next: unknown): InstallEvidence => previous === 'standalone' || next === 'standalone' ? 'standalone' : previous === 'native' || next === 'native' ? 'native' : '';
// Browser fullscreen alone is not installation evidence: a normal tab can enter fullscreen too.
export const standaloneDisplay = (appleStandalone: unknown, standalone: boolean, minimalUI: boolean) => appleStandalone === true || standalone || minimalUI;
