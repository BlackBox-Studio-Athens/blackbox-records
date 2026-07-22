const COVERFLOW_POSITIONS = ['active', 'right-near', 'right-far', 'back', 'left-far', 'left-near'] as const;
const COVERFLOW_POSITION_OFFSETS = [0, 1, 2, 3, -2, -1] as const;
const POINTER_INTENT_DISTANCE = 10;
const TOUCH_SWIPE_DISTANCE = 40;
const TOUCH_HORIZONTAL_DOMINANCE = 1.25;
const WHEEL_THRESHOLD = 48;
const WHEEL_GESTURE_GAP_MS = 160;
const WHEEL_REPEAT_GAP_MS = 120;

export type StoreCoverflowState =
  | { mode: 'preview'; activeIndex: number }
  | { mode: 'catalog'; selectedIndex?: number }
  | { mode: 'search-results' };

export type StoreCoverflowEvent =
  | { type: 'focus'; activeIndex: number }
  | { type: 'move'; delta: -1 | 1 }
  | { type: 'search'; active: boolean }
  | { type: 'toggle' };

export type StoreCoverflowWheelState = {
  accumulatedDelta: number;
  direction: -1 | 0 | 1;
  lastEventAt: number | null;
  lastMoveAt: number | null;
};

type StoreCoverflowGroup = {
  cards: HTMLElement[];
  controls: HTMLElement;
  currentValue: HTMLElement;
  disclosureRail: HTMLElement;
  element: HTMLElement;
  nextButton: HTMLButtonElement;
  positionedCards: Set<HTMLElement>;
  previousButton: HTMLButtonElement;
  remainingValue: HTMLElement;
  reveal: HTMLElement;
  selectedCard: HTMLElement | null;
  stage: HTMLElement;
  state: StoreCoverflowState;
  status: HTMLElement;
  summary: HTMLElement;
  toggleButton: HTMLButtonElement;
};

export type StoreCoverflowDom = {
  groups: StoreCoverflowGroup[];
};

export type StoreCoverflowController = {
  cleanup: () => void;
  setSearchActive: (isActive: boolean) => void;
};

export function ensureStoreCoverflowCapability(
  documentElement: HTMLElement = document.documentElement,
  css: Pick<typeof CSS, 'supports'> | undefined = globalThis.CSS,
) {
  const isCapable = css?.supports('transform-style', 'preserve-3d') ?? false;
  documentElement.toggleAttribute('data-store-coverflow-capable', isCapable);
  return isCapable;
}

export function getStoreCoverflowPosition(cardIndex: number, activeIndex: number, totalCount: number) {
  const relativeIndex = (cardIndex - activeIndex + totalCount) % totalCount;
  if (relativeIndex <= 3) return COVERFLOW_POSITIONS[relativeIndex];
  if (relativeIndex === totalCount - 2) return 'left-far';
  if (relativeIndex === totalCount - 1) return 'left-near';
  return undefined;
}

export function reduceStoreCoverflowState(
  state: StoreCoverflowState,
  event: StoreCoverflowEvent,
  itemCount: number,
): StoreCoverflowState {
  if (event.type === 'search') {
    if (event.active) return { mode: 'search-results' };
    return state.mode === 'search-results' ? { mode: 'catalog' } : state;
  }
  if (event.type === 'toggle') {
    if (state.mode === 'search-results') return state;
    return state.mode === 'preview'
      ? { mode: 'catalog', selectedIndex: state.activeIndex }
      : { mode: 'preview', activeIndex: state.selectedIndex ?? 0 };
  }
  if (state.mode !== 'preview') return state;
  if (event.type === 'focus') {
    return event.activeIndex >= 0 && event.activeIndex < itemCount
      ? { ...state, activeIndex: event.activeIndex }
      : state;
  }

  return { ...state, activeIndex: (state.activeIndex + event.delta + itemCount) % itemCount };
}

export function getStoreCoverflowSwipeDelta(deltaX: number, deltaY: number): -1 | 0 | 1 {
  if (Math.abs(deltaX) < TOUCH_SWIPE_DISTANCE) return 0;
  if (Math.abs(deltaX) < Math.abs(deltaY) * TOUCH_HORIZONTAL_DOMINANCE) return 0;
  return deltaX < 0 ? 1 : -1;
}

export function getStoreCoverflowWheelDelta(
  input: Pick<WheelEvent, 'deltaMode' | 'deltaX' | 'deltaY' | 'shiftKey'>,
  stageWidth: number,
) {
  const rawDelta = Math.abs(input.deltaX) > Math.abs(input.deltaY) ? input.deltaX : input.deltaY;
  if (rawDelta === 0) return null;
  const multiplier = input.deltaMode === 1 ? 16 : input.deltaMode === 2 ? stageWidth : 1;
  return rawDelta * multiplier;
}

export function advanceStoreCoverflowWheelGesture(
  state: StoreCoverflowWheelState,
  delta: number,
  eventTime: number,
): { move: -1 | 0 | 1; state: StoreCoverflowWheelState } {
  const direction = Math.sign(delta) as -1 | 1;
  const startsNewGesture =
    state.lastEventAt === null || eventTime - state.lastEventAt > WHEEL_GESTURE_GAP_MS || direction !== state.direction;
  const nextState = startsNewGesture
    ? { accumulatedDelta: 0, direction, lastEventAt: eventTime, lastMoveAt: null }
    : { ...state, lastEventAt: eventTime };

  nextState.accumulatedDelta += delta;
  if (Math.abs(nextState.accumulatedDelta) < WHEEL_THRESHOLD) return { move: 0, state: nextState };
  if (nextState.lastMoveAt !== null && eventTime - nextState.lastMoveAt < WHEEL_REPEAT_GAP_MS) {
    return { move: 0, state: nextState };
  }

  nextState.accumulatedDelta -= direction * WHEEL_THRESHOLD;
  nextState.lastMoveAt = eventTime;
  return { move: direction, state: nextState };
}

export function readStoreCoverflowDom(root: ParentNode | null): StoreCoverflowDom | null {
  if (!root) return null;
  const elements = [...root.querySelectorAll<HTMLElement>('[data-store-coverflow-group]')];
  const groups = elements
    .map((element): StoreCoverflowGroup | null => {
      const controls = element.querySelector<HTMLElement>('[data-store-coverflow-controls]');
      const currentValue = element.querySelector<HTMLElement>('[data-store-coverflow-current-value]');
      const previousButton = element.querySelector<HTMLButtonElement>('[data-store-coverflow-previous]');
      const nextButton = element.querySelector<HTMLButtonElement>('[data-store-coverflow-next]');
      const toggleButton = element.querySelector<HTMLButtonElement>('[data-store-coverflow-toggle]');
      const disclosureRail = element.querySelector<HTMLElement>('[data-store-coverflow-disclosure-rail]');
      const remainingValue = element.querySelector<HTMLElement>('[data-store-coverflow-remaining-value]');
      const status = element.querySelector<HTMLElement>('[data-store-coverflow-status]');
      const summary = element.querySelector<HTMLElement>('[data-store-coverflow-summary]');
      const reveal = element.querySelector<HTMLElement>('[data-store-coverflow-reveal-mask]');
      const stage = element.querySelector<HTMLElement>('[data-store-coverflow-stage]');
      const cards = [...element.querySelectorAll<HTMLElement>('[data-store-coverflow-card]')];
      const totalCount = Number(element.dataset.storeCoverflowTotal);
      if (
        !controls ||
        !currentValue ||
        !previousButton ||
        !nextButton ||
        !toggleButton ||
        !disclosureRail ||
        !remainingValue ||
        !status ||
        !summary ||
        !reveal ||
        !stage ||
        !Number.isInteger(totalCount) ||
        totalCount <= COVERFLOW_POSITIONS.length ||
        cards.length !== totalCount
      ) {
        return null;
      }

      return {
        cards,
        controls,
        currentValue,
        disclosureRail,
        element,
        nextButton,
        positionedCards: new Set(cards.filter((card) => card.hasAttribute('data-store-coverflow-position'))),
        previousButton,
        remainingValue,
        reveal,
        selectedCard: null,
        stage,
        state: { mode: 'preview', activeIndex: 0 },
        status,
        summary,
        toggleButton,
      };
    })
    .filter((group): group is StoreCoverflowGroup => group !== null);

  return groups.length === elements.length ? { groups } : null;
}

function setAriaDisabled(element: HTMLElement, isDisabled: boolean) {
  element.setAttribute('aria-disabled', String(isDisabled));
}

export function createStoreCoverflowController(
  dom: StoreCoverflowDom,
  documentElement: HTMLElement = document.documentElement,
): StoreCoverflowController | null {
  if (dom.groups.length === 0 || !documentElement.hasAttribute('data-store-coverflow-capable')) return null;

  let revision = 0;
  let inFlight: Animation[] | null = null;

  const renderGroup = (group: StoreCoverflowGroup) => {
    group.element.toggleAttribute('data-store-coverflow-ready', true);
    group.element.setAttribute('aria-roledescription', 'carousel');
    group.element.dataset.storeCoverflowMode = group.state.mode;

    if (group.state.mode === 'preview') {
      const activeIndex = group.state.activeIndex;
      const nextPositions = new Map<HTMLElement, string>();
      COVERFLOW_POSITION_OFFSETS.forEach((offset, positionIndex) => {
        const cardIndex = (activeIndex + offset + group.cards.length) % group.cards.length;
        nextPositions.set(group.cards[cardIndex]!, COVERFLOW_POSITIONS[positionIndex]!);
      });
      group.positionedCards.forEach((card) => {
        if (!nextPositions.has(card)) card.removeAttribute('data-store-coverflow-position');
      });
      nextPositions.forEach((position, card) => {
        card.dataset.storeCoverflowPosition = position;
      });
      group.positionedCards = new Set(nextPositions.keys());
    } else {
      group.positionedCards.forEach((card) => card.removeAttribute('data-store-coverflow-position'));
      group.positionedCards.clear();
    }

    group.selectedCard?.removeAttribute('data-store-coverflow-selected');
    group.selectedCard =
      group.state.mode === 'catalog' && group.state.selectedIndex !== undefined
        ? (group.cards[group.state.selectedIndex] ?? null)
        : null;
    group.selectedCard?.toggleAttribute('data-store-coverflow-selected', true);

    if (group.state.mode === 'preview') {
      group.controls.hidden = false;
      group.status.hidden = false;
      group.previousButton.removeAttribute('aria-disabled');
      group.nextButton.removeAttribute('aria-disabled');
      group.toggleButton.textContent = group.toggleButton.dataset.storeCoverflowViewAllLabel || '';
      group.toggleButton.setAttribute('aria-expanded', 'false');
      if (!group.element.hasAttribute('data-store-coverflow-transitioning')) setAriaDisabled(group.toggleButton, false);
      const currentPosition = group.state.activeIndex + 1;
      group.currentValue.textContent = String(currentPosition);
      group.remainingValue.textContent = String(group.cards.length - currentPosition);
      group.summary.textContent = `You're viewing ${currentPosition} of ${group.cards.length}.`;
      group.element.style.setProperty('--store-coverflow-position-ratio', String(currentPosition / group.cards.length));
      group.status.textContent = group.cards[group.state.activeIndex]!.getAttribute('aria-label') || '';
      return;
    }

    group.status.textContent = '';
    group.status.hidden = true;
    group.previousButton.removeAttribute('aria-disabled');
    group.nextButton.removeAttribute('aria-disabled');
    group.controls.hidden = group.state.mode === 'search-results';
    group.toggleButton.textContent = 'Show Coverflow';
    group.toggleButton.setAttribute('aria-expanded', 'true');
    if (!group.element.hasAttribute('data-store-coverflow-transitioning')) setAriaDisabled(group.toggleButton, false);
  };

  const setGroupState = (group: StoreCoverflowGroup, state: StoreCoverflowState) => {
    group.state = state;
    renderGroup(group);
  };

  const clearTransitionState = () => {
    dom.groups.forEach((group) => {
      group.element.removeAttribute('data-store-coverflow-transitioning');
      group.element.removeAttribute('data-store-coverflow-reveal');
      setAriaDisabled(group.toggleButton, false);
    });
  };

  const cancelTransition = () => {
    revision += 1;
    inFlight?.forEach((animation) => animation.cancel());
    clearTransitionState();
    inFlight = null;
  };

  const runDisclosure = async (group: StoreCoverflowGroup) => {
    if (inFlight || group.state.mode === 'search-results') return;
    const targetState = reduceStoreCoverflowState(group.state, { type: 'toggle' }, group.cards.length);
    const token = ++revision;
    const selectedIndex =
      group.state.mode === 'preview'
        ? group.state.activeIndex
        : group.state.mode === 'catalog'
          ? (group.state.selectedIndex ?? 0)
          : 0;
    const activeCard = group.cards[selectedIndex];

    dom.groups.forEach((coverflowGroup) => {
      coverflowGroup.element.toggleAttribute('data-store-coverflow-transitioning', true);
      setAriaDisabled(coverflowGroup.toggleButton, true);
    });
    inFlight = [];

    try {
      if (targetState.mode === 'catalog') {
        group.element.dataset.storeCoverflowReveal = 'catalog-pending';
        group.element.toggleAttribute('data-store-coverflow-visited', true);
        const railAnimations = group.disclosureRail.getAnimations?.() ?? [];
        inFlight = railAnimations;
        await Promise.allSettled(railAnimations.map((animation) => animation.finished));
        if (revision !== token) return;
      }

      setGroupState(group, targetState);
      if (targetState.mode === 'catalog' && activeCard) {
        group.element.dataset.storeCoverflowReveal = 'catalog';
        activeCard.focus({ preventScroll: true });
        activeCard.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'nearest', inline: 'nearest' });
      }

      const animatedElements = targetState.mode === 'catalog' ? [group.reveal] : [...group.positionedCards];
      const animations = animatedElements.flatMap((element) => element.getAnimations?.() ?? []);
      inFlight = animations;
      await Promise.allSettled(animations.map((animation) => animation.finished));
    } finally {
      if (revision === token) {
        clearTransitionState();
        inFlight = null;
      }
    }
  };

  const groupListeners = dom.groups.map((group) => {
    let suppressClick = false;
    let wheelState: StoreCoverflowWheelState = {
      accumulatedDelta: 0,
      direction: 0,
      lastEventAt: null,
      lastMoveAt: null,
    };
    const touchPointers = new Set<number>();
    let pointerIntent: {
      card: HTMLElement | null;
      horizontalIntent: boolean;
      moved: boolean;
      pointerId: number;
      pointerType: string;
      startX: number;
      startY: number;
      wasActive: boolean;
    } | null = null;

    const resetWheelState = () => {
      wheelState = { accumulatedDelta: 0, direction: 0, lastEventAt: null, lastMoveAt: null };
    };

    const onPointerDown = (event: PointerEvent) => {
      if (group.state.mode !== 'preview' || event.button !== 0 || event.isPrimary === false) {
        pointerIntent = null;
        return;
      }
      const card =
        event.target instanceof Element ? event.target.closest<HTMLElement>('[data-store-coverflow-card]') : null;
      const cardIndex = card ? group.cards.indexOf(card) : -1;
      if (event.pointerType === 'touch') {
        touchPointers.add(event.pointerId);
        if (touchPointers.size > 1) {
          pointerIntent = null;
          return;
        }
      } else if (cardIndex < 0) {
        pointerIntent = null;
        return;
      }

      pointerIntent = {
        card,
        horizontalIntent: false,
        moved: false,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        startX: event.clientX,
        startY: event.clientY,
        wasActive: cardIndex === group.state.activeIndex,
      };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!pointerIntent || pointerIntent.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - pointerIntent.startX;
      const deltaY = event.clientY - pointerIntent.startY;
      if (pointerIntent.pointerType === 'touch') {
        if (touchPointers.size > 1) {
          pointerIntent = null;
          return;
        }
        if (
          !pointerIntent.horizontalIntent &&
          Math.abs(deltaX) >= POINTER_INTENT_DISTANCE &&
          Math.abs(deltaX) >= Math.abs(deltaY) * TOUCH_HORIZONTAL_DOMINANCE
        ) {
          pointerIntent.horizontalIntent = true;
          group.stage.setPointerCapture?.(event.pointerId);
        }
        pointerIntent.moved = deltaX * deltaX + deltaY * deltaY > POINTER_INTENT_DISTANCE * POINTER_INTENT_DISTANCE;
        if (pointerIntent.horizontalIntent) event.preventDefault();
        return;
      }
      pointerIntent.moved = deltaX * deltaX + deltaY * deltaY > POINTER_INTENT_DISTANCE * POINTER_INTENT_DISTANCE;
    };
    const onPointerUp = (event: PointerEvent) => {
      touchPointers.delete(event.pointerId);
      if (!pointerIntent || pointerIntent.pointerId !== event.pointerId || pointerIntent.pointerType !== 'touch')
        return;
      const intent = pointerIntent;
      if (intent.horizontalIntent) group.stage.releasePointerCapture?.(event.pointerId);
      const delta = getStoreCoverflowSwipeDelta(event.clientX - intent.startX, event.clientY - intent.startY);
      if (!delta || group.state.mode !== 'preview') return;
      pointerIntent = null;
      event.preventDefault();
      suppressClick = true;
      setGroupState(group, reduceStoreCoverflowState(group.state, { type: 'move', delta }, group.cards.length));
    };
    const onPointerCancel = (event: PointerEvent) => {
      touchPointers.delete(event.pointerId);
      if (pointerIntent?.pointerId === event.pointerId) {
        if (pointerIntent.horizontalIntent) group.stage.releasePointerCapture?.(event.pointerId);
        pointerIntent = null;
      }
    };
    const onFocusOut = (event: FocusEvent) => {
      const target =
        event.target instanceof Element ? event.target.closest<HTMLElement>('[data-store-coverflow-card]') : null;
      if (target && pointerIntent?.card === target && pointerIntent.pointerType !== 'touch') pointerIntent = null;
    };
    const onClick = (event: MouseEvent) => {
      if (suppressClick) {
        suppressClick = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      if (target.closest('[data-store-coverflow-previous]')) {
        if (group.state.mode === 'preview') {
          setGroupState(group, reduceStoreCoverflowState(group.state, { type: 'move', delta: -1 }, group.cards.length));
        }
        return;
      }
      if (target.closest('[data-store-coverflow-next]')) {
        if (group.state.mode === 'preview') {
          setGroupState(group, reduceStoreCoverflowState(group.state, { type: 'move', delta: 1 }, group.cards.length));
        }
        return;
      }
      if (
        target.closest('[data-store-coverflow-toggle]') &&
        group.toggleButton.getAttribute('aria-disabled') !== 'true'
      ) {
        void runDisclosure(group);
        return;
      }

      const card = target.closest<HTMLElement>('[data-store-coverflow-card]');
      if (group.state.mode !== 'preview' || !card || event.detail === 0 || pointerIntent?.card !== card) return;
      const intent = pointerIntent;
      pointerIntent = null;
      if (!intent.moved && intent.wasActive) return;

      event.preventDefault();
      event.stopPropagation();
      if (intent.moved) return;
      const activeIndex = group.cards.indexOf(card);
      if (activeIndex >= 0) {
        setGroupState(
          group,
          reduceStoreCoverflowState(group.state, { type: 'focus', activeIndex }, group.cards.length),
        );
        card.focus({ preventScroll: true });
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (group.state.mode !== 'preview') return;
      const target =
        event.target instanceof Element ? event.target.closest<HTMLElement>('[data-store-coverflow-card]') : null;
      if (target && pointerIntent?.card === target) return;
      const activeIndex = target ? group.cards.indexOf(target) : -1;
      if (activeIndex >= 0 && activeIndex !== group.state.activeIndex) {
        setGroupState(
          group,
          reduceStoreCoverflowState(group.state, { type: 'focus', activeIndex }, group.cards.length),
        );
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (group.state.mode !== 'preview' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      const delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0;
      if (!delta) return;

      const target = event.target instanceof Element ? event.target : null;
      const focusedCard = target?.closest<HTMLElement>('[data-store-coverflow-card]') ?? null;
      if (focusedCard && !group.cards.includes(focusedCard)) return;

      event.preventDefault();
      const nextState = reduceStoreCoverflowState(group.state, { type: 'move', delta }, group.cards.length);
      setGroupState(group, nextState);
      if (focusedCard && nextState.mode === 'preview') {
        group.cards[nextState.activeIndex]?.focus({ preventScroll: true });
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (group.state.mode !== 'preview' || event.ctrlKey) return;
      const delta = getStoreCoverflowWheelDelta(event, group.stage.clientWidth);
      if (delta === null) return;
      event.preventDefault();
      const result = advanceStoreCoverflowWheelGesture(wheelState, delta, event.timeStamp);
      wheelState = result.state;
      if (result.move) {
        setGroupState(
          group,
          reduceStoreCoverflowState(group.state, { type: 'move', delta: result.move }, group.cards.length),
        );
      }
    };

    group.element.addEventListener('click', onClick);
    group.element.addEventListener('focusin', onFocusIn);
    group.element.addEventListener('focusout', onFocusOut);
    group.element.addEventListener('keydown', onKeyDown);
    group.stage.addEventListener('pointercancel', onPointerCancel);
    group.stage.addEventListener('pointerdown', onPointerDown);
    group.stage.addEventListener('pointerleave', resetWheelState);
    group.stage.addEventListener('pointermove', onPointerMove);
    group.stage.addEventListener('pointerup', onPointerUp);
    group.stage.addEventListener('wheel', onWheel, { passive: false });
    renderGroup(group);
    return {
      group,
      onClick,
      onFocusIn,
      onFocusOut,
      onKeyDown,
      onPointerCancel,
      onPointerDown,
      onPointerLeave: resetWheelState,
      onPointerMove,
      onPointerUp,
      onWheel,
    };
  });

  return {
    setSearchActive(isActive) {
      cancelTransition();
      dom.groups.forEach((group) => {
        setGroupState(
          group,
          reduceStoreCoverflowState(group.state, { type: 'search', active: isActive }, group.cards.length),
        );
      });
    },
    cleanup() {
      cancelTransition();
      groupListeners.forEach(
        ({
          group,
          onClick,
          onFocusIn,
          onFocusOut,
          onKeyDown,
          onPointerCancel,
          onPointerDown,
          onPointerLeave,
          onPointerMove,
          onPointerUp,
          onWheel,
        }) => {
          group.element.removeEventListener('click', onClick);
          group.element.removeEventListener('focusin', onFocusIn);
          group.element.removeEventListener('focusout', onFocusOut);
          group.element.removeEventListener('keydown', onKeyDown);
          group.stage.removeEventListener('pointercancel', onPointerCancel);
          group.stage.removeEventListener('pointerdown', onPointerDown);
          group.stage.removeEventListener('pointerleave', onPointerLeave);
          group.stage.removeEventListener('pointermove', onPointerMove);
          group.stage.removeEventListener('pointerup', onPointerUp);
          group.stage.removeEventListener('wheel', onWheel);
          group.state = { mode: 'preview', activeIndex: 0 };
          renderGroup(group);
          group.element.removeAttribute('data-store-coverflow-ready');
          group.element.removeAttribute('data-store-coverflow-visited');
          group.element.removeAttribute('aria-roledescription');
        },
      );
    },
  };
}
