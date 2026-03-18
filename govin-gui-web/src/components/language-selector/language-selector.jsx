import PropTypes from 'prop-types';
import React from 'react';

import locales from 'govin-l10n';
import styles from './language-selector.css';

// supported languages to exclude from the menu, but allow as a URL option
const ignore = [];

const LanguageSelector = ({className, currentLocale, label, onChange, style}) => (
    <select
        aria-label={label}
        className={[styles.languageSelect, className].filter(Boolean).join(' ')}
        style={style}
        value={currentLocale}
        onChange={onChange}
    >
        {
            Object.keys(locales)
                .filter(l => !ignore.includes(l))
                .map(locale => (
                    <option
                        key={locale}
                        value={locale}
                    >
                        {locales[locale].name}
                    </option>
                ))
        }
    </select>
);

LanguageSelector.propTypes = {
    className: PropTypes.string,
    currentLocale: PropTypes.string,
    label: PropTypes.string,
    onChange: PropTypes.func,
    style: PropTypes.object // eslint-disable-line react/forbid-prop-types
};

export default LanguageSelector;
