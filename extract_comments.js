// Heuristics for VI/EN Facebook desktop pages. Verify against real posts.
// Used on a selected post dialog/main, not on the entire Facebook feed.
(scope, options) => {
    const clean = value => (value || '').normalize('NFC').replace(/\s+/g, ' ').trim();
    const visible = el => !el.closest('[hidden], [aria-hidden="true"]') && Boolean(el.getClientRects().length) &&
        getComputedStyle(el).visibility !== 'hidden' &&
        getComputedStyle(el).display !== 'none';
    const uiText = /^(thích|like|trả lời|reply|phản hồi|đã chỉnh sửa|edited|chia sẻ|share|xem bản dịch|see translation|ẩn|hide|tác giả|author|quản trị viên|admin|người đóng góp hàng đầu|top contributor|theo dõi|follow)$/iu;
    const timeText = /^(?:\d+\s*(?:giây|phút|giờ|ngày|tuần|tháng|năm|s|m|h|d|w|y)|vừa xong|just now)$/iu;
    const messageText = node => {
        if (node.nodeType === 3) return node.textContent || '';
        if (node.nodeType !== 1) return '';
        if (node.tagName === 'A' || node.getAttribute('role') === 'link') {
            const href = node.getAttribute('href') || '';
            return (!href && node.getAttribute('role') === 'link') || /\/user\/|profile\.php|facebook\.com\/(?!groups\/[^/]+\/(?:posts|permalink)\/)/iu.test(href)
                ? ' [MENTION] ' : ' [URL] ';
        }
        if (node.tagName === 'BR') return ' ';
        return [...node.childNodes].map(messageText).join('');
    };
    const own = (el, article) => el.closest(options.articleSelector) === article;
    const results = [];
    const candidates = [...scope.querySelectorAll(options.articleSelector)];
    for (const article of candidates) {
        if (!visible(article)) continue;
        const label = clean(article.getAttribute('aria-label'));
        const labelled = /^(?:comment by|reply by|bình luận (?:của|dưới tên)|phản hồi (?:bình luận của|của|dưới tên)|câu trả lời của)(?:\s|:)/iu.test(label)
            || / đáp lại phản hồi của /iu.test(label);
        const actions = [...article.querySelectorAll('[role="button"], button, a')]
            .filter(el => own(el, article) && visible(el));
        const hasReply = actions.some(el => /^(trả lời|reply|phản hồi)$/iu.test(clean(el.innerText)));
        const isOuterPost = Boolean(article.querySelector(options.articleSelector)) && !labelled;
        // In default mode a comment must have either a comment label or a reply action.
        // Explicit selectors allow adaptation when Facebook changes its markup.
        if (!options.customSelectors && (!labelled && (!hasReply || isOuterPost))) continue;
        const blocks = [...article.querySelectorAll(options.textSelector)].filter(el => {
            if (!own(el, article) || !visible(el)) return false;
            if (el.closest('a, [role="link"], button, [role="button"], [role="textbox"], [contenteditable="true"]')) return false;
            if (el.querySelector('button, [role="button"], [role="article"]')) return false;
            const text = clean(el.innerText);
            return text && !uiText.test(text) && !timeText.test(text);
        });
        // Prefer an outer message block over its nested spans (avoid repeated text).
        const outer = blocks.filter(el => !blocks.some(other => other !== el && other.contains(el)));
        const pieces = [];
        for (const el of outer) {
            // Keep the sentence around mentions; avoid exporting profile names.
            const text = clean(messageText(el));
            if (!pieces.includes(text)) pieces.push(text);
        }
        if (pieces.length && pieces.join(' ').replace(/\[(?:MENTION|URL)\]/g, '').trim()) {
            results.push({
                text: pieces.join('\n'),
                extraction_method: options.customSelectors ? 'custom_selector' :
                    (labelled ? 'comment_aria_label' : 'reply_action_heuristic'),
            });
        }
    }
    return results;
}
