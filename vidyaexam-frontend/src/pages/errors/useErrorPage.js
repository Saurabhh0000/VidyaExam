import { useEffect, useRef } from "react";

/** Sets the tab title and moves focus to the page heading after navigation. */
export default function useErrorPage(title) {
  const headingRef = useRef(null);
  useEffect(() => {
    document.title = title;
    headingRef.current?.focus();
  }, [title]);
  return headingRef;
}