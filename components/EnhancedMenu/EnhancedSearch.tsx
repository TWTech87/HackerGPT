import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { ToolID } from '@/types/tool';
import { OpenAIModelID } from '@/types/openai';

import HomeContext from '@/pages/api/home/home.context';

const EnhancedSearchToggle = () => {
  const { t } = useTranslation('enhance search');
  const [isEnabled, setIsEnabled] = useState(true);
  const {
    state: { selectedToolId, selectedConversation },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const ENHANCED_SEARCH_TOOL_ID = ToolID.ENHANCEDSEARCH;

  useEffect(() => {
    if (
      isEnabled &&
      selectedConversation?.model.id !== OpenAIModelID.HackerGPT_PRO
    ) {
      if (selectedToolId !== ENHANCED_SEARCH_TOOL_ID) {
        homeDispatch({
          type: 'SET_SELECTED_TOOL_ID',
          payload: ENHANCED_SEARCH_TOOL_ID,
        });
      }
    } else {
      if (selectedToolId === ENHANCED_SEARCH_TOOL_ID) {
        homeDispatch({
          type: 'SET_SELECTED_TOOL_ID',
          payload: null,
        });
      }
    }
  }, [isEnabled, selectedToolId, selectedConversation, homeDispatch]);

  const handleToggleChange = () => {
    if (selectedToolId && selectedToolId !== ENHANCED_SEARCH_TOOL_ID) {
      alert(
        t(
          'Cannot enable "Enhance Search" feature while another plugin is selected.',
        ),
      );
      return;
    }

    setIsEnabled(!isEnabled);
  };

  return (
    <div className="flex w-full flex-row items-center justify-between md:justify-start">
      <label className="mr-2 text-left text-sm text-neutral-700 dark:text-neutral-300">
        {t('Enhance Search')}
      </label>
      <div className="relative">
        <input
          id="search-toggle"
          type="checkbox"
          className="sr-only"
          checked={isEnabled}
          onChange={handleToggleChange}
        />
        <label
          htmlFor="search-toggle"
          className={`block h-6 w-12 rounded-full transition-colors duration-200 ${
            isEnabled ? 'bg-blue-500' : 'bg-[#555]'
          }`}
        />
        <span
          className={`absolute left-1 top-1 h-4 w-4 transform rounded-full bg-white transition-transform ${
            isEnabled ? 'translate-x-6' : ''
          }`}
        />
      </div>
    </div>
  );
};

export default EnhancedSearchToggle;
