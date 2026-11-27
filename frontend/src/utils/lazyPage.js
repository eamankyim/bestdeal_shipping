import React, { useEffect, useState } from 'react';
import { Button, Result } from 'antd';
import PageLoading from '../components/common/PageLoading';

const RELOADED_AT = 'bestdeal_reloaded_for_update';

/**
 * A download fails when the app was updated while this tab was open: the old files are gone from
 * the server. Reloading gets the new version. Returns false when a reload was already tried in the
 * last minute, so a real network problem shows a message instead of reloading again and again.
 */
const reloadForNewVersion = () => {
  try {
    if (Date.now() - Number(sessionStorage.getItem(RELOADED_AT) || 0) < 60000) return false;
    sessionStorage.setItem(RELOADED_AT, String(Date.now()));
  } catch (error) {
    return false;
  }
  window.location.reload();
  return true;
};

/** Runs `task` once the browser has nothing else to do (within 3 seconds at most). */
export const whenIdle = (task) => (window.requestIdleCallback ? window.requestIdleCallback(task, { timeout: 3000 }) : setTimeout(task, 200));

/**
 * A page (or a large part of one) downloaded the first time it is needed. Once downloaded it shows
 * straight away. React.lazy would hold it back behind a Suspense spinner for up to 300 ms after
 * every download, cached or not, so it is not used.
 *
 * Options:
 *  fallback - shown while downloading (a spinner; null for drawers and dialogs)
 *  idle     - download once the browser has nothing else to do, not at once (parts that are
 *             only opened later, such as a job's drawer)
 *  isOpen   - with idle: (props) => true when the part is being opened, so it downloads at once
 */
export const lazyPage = (load, { fallback = <PageLoading />, idle = false, isOpen = () => false } = {}) => {
  let Loaded = null;
  let loading = null;

  const preload = () => {
    if (!loading) {
      loading = load().then((module) => {
        Loaded = module.default;
        return Loaded;
      });
      // A failed download can be tried again
      loading.catch(() => {
        loading = null;
      });
    }
    return loading;
  };

  const LazyPage = (props) => {
    const [, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const now = !idle || isOpen(props);

    useEffect(() => {
      if (Loaded) return undefined;
      let mounted = true;
      const start = () => preload().then(
        () => mounted && setLoaded(true),
        () => {
          // A background download that failed is tried again when the part is opened; only
          // something the person asked for reloads the page
          if (mounted && now && !reloadForNewVersion()) setFailed(true);
        },
      );
      if (now) start();
      else whenIdle(start);
      return () => {
        mounted = false;
      };
    }, [now]);

    if (Loaded) return <Loaded {...props} />;
    if (failed && fallback !== null) {
      return (
        <Result
          status="warning"
          title="This page could not be loaded"
          subTitle="Check the internet connection and try again."
          extra={<Button type="primary" onClick={() => window.location.reload()}>Try Again</Button>}
        />
      );
    }
    return fallback;
  };

  LazyPage.preload = preload;
  return LazyPage;
};

export default lazyPage;
