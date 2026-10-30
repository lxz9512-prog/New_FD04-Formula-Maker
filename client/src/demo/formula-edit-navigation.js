// Keep return context on the editor's own history entry, never in shared storage.
// This also survives a refresh without leaking an earlier entry's origin.
function isReturnPath(path) {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !/[\\\r\n]/.test(path) &&
    path.split(/[?#]/)[0] !== '/formula-edit'
  );
}

export function formulaEditEntry(location, screenState) {
  const to = `${location.pathname}${location.search || ''}${location.hash || ''}`;
  if (!isReturnPath(to)) return {};
  return {
    state: {
      formulaEditOrigin: {
        to,
        state:
          screenState === undefined ? (location.state ?? null) : screenState,
      },
    },
  };
}

export function formulaEditReturnTarget(state, fallback) {
  const origin = state?.formulaEditOrigin;
  return origin && isReturnPath(origin.to)
    ? { to: origin.to, options: { state: origin.state ?? null } }
    : { to: fallback, options: {} };
}

export function ratioSyncScreenState(state) {
  const saved = state?.formulaRatioSync;
  return {
    drawerOpen: saved?.drawerOpen === true,
    selectedId: typeof saved?.selectedId === 'string' ? saved.selectedId : null,
  };
}

export function openFormulaEditor(navigate, location, to, screenState) {
  const entry = formulaEditEntry(location, screenState);
  if (screenState !== undefined) {
    // Preserve the drawer for browser Back as well as the editor's back arrow.
    navigate(
      `${location.pathname}${location.search || ''}${location.hash || ''}`,
      {
        replace: true,
        state: screenState,
      },
    );
  }
  navigate(to, entry);
}
