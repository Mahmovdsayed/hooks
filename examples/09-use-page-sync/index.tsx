"use client";

import { Suspense } from "react";
import { usePageSync } from "@hirely/hooks";

const ITEMS = Array.from({ length: 47 }, (_, i) => `Item #${i + 1}`);
const PAGE_SIZE = 6;
const TOTAL_PAGES = Math.ceil(ITEMS.length / PAGE_SIZE);

function PageSyncExample() {
    const { currentPage, nextPage, prevPage, isFirstPage, isLastPage } = usePageSync({ maxPage: TOTAL_PAGES });

    const items = ITEMS.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    return (
        <div>
            <h2>usePageSync</h2>
            <p>
                Current URL: <code>?page={currentPage}</code> — try the browser&apos;s
                back / forward buttons.
            </p>

            <ul>
                {items.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button onClick={prevPage} disabled={isFirstPage}>
                    ← Prev
                </button>
                <span>
                    Page {currentPage} / {TOTAL_PAGES}
                </span>
                <button onClick={nextPage} disabled={isLastPage}>
                    Next →
                </button>
            </div>
        </div>
    );
}

// useSearchParams() (used internally) needs a Suspense boundary.
export default function UsePageSyncExample() {
    return (
        <Suspense>
            <PageSyncExample />
        </Suspense>
    );
}