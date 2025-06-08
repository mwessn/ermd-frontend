type IdScope = 'col' | 'table' | 'relation' | 'commentArea';

export function generateId(scope: IdScope): string {
    let id: string;
    const random = Math.random().toString(36).substring(2, 8); // 6-char random
    const timestamp = Date.now().toString(36); // compact timestamp
    id = `${scope}-${timestamp}-${random}`;

    return id;
}

export const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

export const resetFocus = () => {
    document.body.setAttribute("tabindex", "-1");
    document.body.focus();
    document.body.removeAttribute("tabindex");
}

export function sleep(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export function notBlankOrEmpty(val: string) {
    return val.trim().length > 0;
}
