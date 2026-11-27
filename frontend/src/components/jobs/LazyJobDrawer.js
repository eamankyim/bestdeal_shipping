import { lazyPage } from '../../utils/lazyPage';

// A job's drawer, with every dialog it can open, is a large download only needed once a job is
// opened. Pages show without waiting for it; it is fetched as soon as the browser is idle, or at
// once if a job is opened before then.
const LazyJobDrawer = lazyPage(() => import('./JobDrawer'), {
  fallback: null,
  idle: true,
  isOpen: (props) => Boolean(props.jobId),
});

export default LazyJobDrawer;
