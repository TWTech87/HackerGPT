import { IconX, IconSettings, IconKey, IconTrash } from '@tabler/icons-react';
import {
  FC,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useTranslation } from 'next-i18next';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import { getSettings, saveSettings } from '@/utils/app/settings';

import { Settings } from '@/types/settings';

import HomeContext from '@/pages/api/home/home.context';

import { getAuth } from 'firebase/auth';
import { initFirebaseApp } from '@/utils/server/firebase-client-init';

import { getPremiumStatus } from '@/components/Payments/getPremiumStatus';
import { getPortalUrl } from '@/components/Payments/stripePayments';

import { useLogOut } from '@/components/Authorization/LogOutButton';
import { useRouter } from 'next/navigation';

import { ClipLoader } from 'react-spinners';
import { getCryptoPaymentStatus } from '@/utils/app/crypto';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const SettingDialog: FC<Props> = ({ open, onClose }) => {
  const { t } = useTranslation('settings');
  const settings: Settings = getSettings();
  const { state, dispatch } = useCreateReducer<Settings>({
    initialState: settings,
  });
  const { dispatch: homeDispatch } = useContext(HomeContext);
  const modalRef = useRef<HTMLDivElement>(null);
  const { isUserLoggedIn, handleLogOut } = useLogOut();
  const router = useRouter();
  const [isPremium, setIsPremium] = useState(false);
  const [preFetchedPortalUrl, setPreFetchedPortalUrl] = useState<string | null>(
    null,
  );
  const [cryptoPaymentStatus, setCryptoPaymentStatus] = useState<string | null>(
    null,
  );

  const [isFetchingcryptoPaymentStatus, setIsFetchingCryptoPaymentStatus] =
    useState<boolean>(true);

  const app = initFirebaseApp();
  const auth = getAuth(app);

  const tabs = [
    {
      name: 'General',
      icon: <IconSettings size={22} strokeWidth={2} />,
      isProtected: false,
    },
  ];

  const [selectedTab, setSelectedTab] = useState(tabs[0].name);

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (isPremium) {
      getToken();
      getStatus();
    } else {
      setCryptoPaymentStatus(null);
      setIsFetchingCryptoPaymentStatus(false);
    }
  }, [selectedTab, isPremium]);

  const checkPremiumAndPortal = async () => {
    const newPremiumStatus = auth.currentUser
      ? await getPremiumStatus(app)
      : false;
    setIsPremium(newPremiumStatus);
    if (newPremiumStatus && isUserLoggedIn) {
      try {
        const portalUrl = await getPortalUrl(app);
        setPreFetchedPortalUrl(portalUrl);
      } catch (error) {
        console.error('Error pre-fetching portal URL:', error);
      }
    }
  };

  const getToken = async () => {
    if (auth.currentUser) {
      try {
        setToken(await auth.currentUser.getIdToken(true));
      } catch (error) {
        return null;
      }
    }
  };

  const getStatus = async () => {
    if (token) {
      const status = (await getCryptoPaymentStatus(token)) || null;
      setCryptoPaymentStatus(status);
      setIsFetchingCryptoPaymentStatus(false);
    }
  };

  useEffect(() => {
    checkPremiumAndPortal();
    if (isPremium) {
      getToken();
      getStatus();
    } else {
      setCryptoPaymentStatus(null);
      setIsFetchingCryptoPaymentStatus(false);
    }
  }, [app, auth.currentUser?.uid, isUserLoggedIn]);

  const manageSubscription = () => {
    if (preFetchedPortalUrl) {
      router.push(preFetchedPortalUrl);
    } else {
      (async () => {
        try {
          const portalUrl = await getPortalUrl(app);
          router.push(portalUrl);
        } catch (error) {
          console.error('Error fetching portal URL:', error);
        }
      })();
    }
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        window.addEventListener('mouseup', handleMouseUp);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      window.removeEventListener('mouseup', handleMouseUp);
      onClose();
    };

    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onClose]);

  useEffect(() => {
    homeDispatch({ field: 'lightMode', value: state.theme });
    saveSettings(state);
  }, [state.theme]);

  if (!open) {
    return null;
  }

  return (
    <div className="inset-negative-5 fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="fixed inset-0 z-10 overflow-hidden">
        <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
          <div
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          />
          {/* Modal dialog container */}
          <div
            ref={modalRef}
            className="inline-block max-h-[80%] w-11/12 transform overflow-y-auto rounded-lg border border-gray-300 bg-white pb-4 pt-5 text-left align-bottom shadow-xl transition-all dark:border-neutral-400 dark:bg-hgpt-dark-gray sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-3xl sm:p-2 sm:align-middle"
            role="dialog"
          >
            {/* Close button */}
            <div className="px-4 pt-5 text-black dark:text-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{t('Settings')}</h3>
                <button onClick={onClose}>
                  <IconX color="gray" size={22} strokeWidth={2} />
                </button>
              </div>
              <hr className="my-4 border-hgpt-chat-gray dark:border-white" />
            </div>

            {/* Tabbed Layout */}
            <div className="flex flex-col sm:flex-col">
              {/* Sidebar with tabs */}
              <div>
                <nav className="flex justify-center" aria-label="Sidebar">
                  {tabs.map((tab) => {
                    // Only show the tab if it is not protected, or if it is protected and the user is a premium, logged-in user
                    if (
                      !tab.isProtected ||
                      (tab.isProtected && isUserLoggedIn)
                    ) {
                      return (
                        <button
                          key={tab.name}
                          onClick={() => setSelectedTab(tab.name)}
                          className={`mb-2 mr-2 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium sm:mb-2 sm:mr-0 sm:justify-start ${
                            selectedTab === tab.name
                              ? 'bg-hgpt-hover-white text-black dark:bg-hgpt-chat-gray dark:text-neutral-200'
                              : 'text-black hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {tab.icon}
                          <span className="ml-2">{tab.name}</span>
                        </button>
                      );
                    }
                    return null;
                  })}
                </nav>
              </div>

              {/* Content for the selected tab */}
              <div className="w-full p-6">
                {selectedTab === 'General' && (
                  <div>
                    <div className="mb-2 text-sm font-bold text-black dark:text-neutral-200">
                      {t('Theme')}
                    </div>
                    <div className="w-full rounded-lg border border-neutral-200 bg-transparent pr-1 text-neutral-900 focus:outline-none dark:border-neutral-500 dark:text-white">
                      <select
                        className="w-full cursor-pointer bg-transparent p-2 text-neutral-700 focus:outline-none dark:text-neutral-200"
                        value={state.theme}
                        onChange={(event) =>
                          dispatch({
                            field: 'theme',
                            value: event.target.value,
                          })
                        }
                      >
                        <option
                          className="font-sans dark:bg-[#343541] dark:text-white"
                          value="dark"
                        >
                          {t('Dark mode')}
                        </option>
                        <option
                          className="font-sans dark:bg-[#343541] dark:text-white"
                          value="light"
                        >
                          {t('Light mode')}
                        </option>
                      </select>
                    </div>
                    {isFetchingcryptoPaymentStatus ? (
                      <div className="flex justify-center py-4">
                        <ClipLoader size={30} color="white" />
                      </div>
                    ) : (
                      <>
                        {isPremium &&
                          isUserLoggedIn &&
                          !cryptoPaymentStatus && (
                            <button
                              type="button"
                              className="mt-6 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-black shadow hover:bg-hgpt-hover-white dark:bg-hgpt-dark-gray dark:text-white dark:hover:bg-hgpt-medium-gray"
                              onClick={manageSubscription}
                            >
                              <span>Manage Subscription</span>
                            </button>
                          )}
                        {cryptoPaymentStatus && isUserLoggedIn ? (
                          <div className="mt-5">
                            <b className="mb-2 text-sm font-bold text-black dark:text-neutral-200">
                              Subscription
                            </b>
                            <p className="text-black dark:text-neutral-200">
                              {cryptoPaymentStatus}
                            </p>
                          </div>
                        ) : null}
                      </>
                    )}
                    {isUserLoggedIn ? (
                      <>
                        <button
                          type="button"
                          className="mt-6 w-full rounded-lg border border-red-700 bg-red-600 px-4 py-2 text-white shadow hover:bg-red-500 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-red-700 dark:text-white dark:hover:bg-red-500"
                          onClick={handleLogOut}
                        >
                          Log Out
                        </button>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
