/**
 * KPI Inline Data Parser for Cristiano Ronaldo Website
 * Parses inline JSON data and updates KPI elements
 */

(function() {
  'use strict';

  // Graceful no-op function for missing elements
  function noop() {
    return;
  }

  // Safe element selector with fallback
  function safeSelector(selector) {
    try {
      return document.querySelector(selector);
    } catch (error) {
      console.warn('KPI: Invalid selector:', selector);
      return null;
    }
  }

  // Safe text content update
  function safeUpdateText(element, text) {
    if (element && typeof text !== 'undefined') {
      element.textContent = text;
    }
  }

  // Parse inline data and update KPIs
  function updateKPIs() {
    try {
      // Get the inline data script
      const dataScript = document.getElementById('cr7-data');
      if (!dataScript) {
        console.warn('KPI: No cr7-data script found');
        return;
      }

      // Parse the JSON data
      const data = JSON.parse(dataScript.textContent);
      if (!data) {
        console.warn('KPI: Failed to parse data');
        return;
      }

      // Update national team KPIs
      if (data.national_team) {
        const intlGoalsEl = safeSelector('#kpi-intl-goals') || safeSelector('#chip-intl-goals');
        const intlCapsEl = safeSelector('#kpi-intl-caps') || safeSelector('#chip-intl-caps');
        const intlAsOfEl = safeSelector('#kpi-intl-asof') || safeSelector('#chip-intl-asof');

        safeUpdateText(intlGoalsEl, data.national_team.goals);
        safeUpdateText(intlCapsEl, data.national_team.caps);
        safeUpdateText(intlAsOfEl, data.national_team.as_of);
      }

      // Update Al Nassr KPIs
      if (data.al_nassr) {
        const clubGoalsEl = safeSelector('#kpi-club-goals') || safeSelector('#chip-club-goals');
        const clubGamesEl = safeSelector('#kpi-club-games') || safeSelector('#chip-club-games');
        const clubAsOfEl = safeSelector('#kpi-club-asof') || safeSelector('#chip-club-asof');

        safeUpdateText(clubGoalsEl, data.al_nassr.goals);
        safeUpdateText(clubGamesEl, data.al_nassr.games);
        safeUpdateText(clubAsOfEl, data.al_nassr.as_of);
      }

      console.log('KPI: Data updated successfully');

    } catch (error) {
      console.error('KPI: Error updating data:', error);
    }
  }

  // Initialize when DOM is ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateKPIs);
    } else {
      updateKPIs();
    }
  }

  // Start initialization
  init();

})();
