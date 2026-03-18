const SET_THEME = 'scratch-gui/theme/SET_THEME';

const initialState = {
    isDarkTheme: false
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_THEME:
        return Object.assign({}, state, {
            isDarkTheme: action.isDarkTheme
        });
    default:
        return state;
    }
};

const setTheme = function (isDarkTheme) {
    return {
        type: SET_THEME,
        isDarkTheme: isDarkTheme
    };
};

export {
    reducer as default,
    initialState as themeInitialState,
    setTheme
};
