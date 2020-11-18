import {
  _getTextWithExcludedElements,
  ElementDimensions,
  ModifierKeys,
  TestElement,
  TestKey,
  TextOptions,
} from '@angular/cdk/testing';
import { ClientFunction, Selector, t } from 'testcafe';

const TestController = typeof t;

/** Maps the `TestKey` constants to TestCafe's `Key` constants. */
const keyMap = {
  [TestKey.BACKSPACE]: 'backspace',
  [TestKey.TAB]: 'tab',
  [TestKey.ENTER]: 'enter',
  [TestKey.SHIFT]: 'shift',
  [TestKey.CONTROL]: 'ctrl',
  [TestKey.ALT]: 'alt',
  [TestKey.ESCAPE]: 'esc',
  [TestKey.PAGE_UP]: 'pageup',
  [TestKey.PAGE_DOWN]: 'pagedown',
  [TestKey.END]: 'end',
  [TestKey.HOME]: 'home',
  [TestKey.LEFT_ARROW]: 'left',
  [TestKey.UP_ARROW]: 'up',
  [TestKey.RIGHT_ARROW]: 'right',
  [TestKey.DOWN_ARROW]: 'down',
  [TestKey.INSERT]: 'insert',
  [TestKey.DELETE]: 'delete',
  [TestKey.F1]: 'f1',
  [TestKey.F2]: 'f2',
  [TestKey.F3]: 'f3',
  [TestKey.F4]: 'f4',
  [TestKey.F5]: 'f5',
  [TestKey.F6]: 'f6',
  [TestKey.F7]: 'f7',
  [TestKey.F8]: 'f8',
  [TestKey.F9]: 'f9',
  [TestKey.F10]: 'f10',
  [TestKey.F11]: 'f11',
  [TestKey.F12]: 'f12',
  [TestKey.META]: 'meta',
};

/** Converts a `ModifierKeys` object to a list of TestCafe `Key`s. */
function toTestCafeModifierKeys(modifiers: ModifierKeys): string[] {
  const result: string[] = [];
  if (modifiers.control) {
    result.push('ctrl');
  }
  if (modifiers.alt) {
    result.push('alt');
  }
  if (modifiers.shift) {
    result.push('shift');
  }
  if (modifiers.meta) {
    result.push('meta');
  }
  return result;
}

/** A `TestElement` implementation for TestCafe. */
export class TestCafeElement implements TestElement {
  constructor(
    private readonly tc: TestController,
    private readonly element: Selector
  ) {}

  async blur(): Promise<void> {
    // TODO
    this.tc.pressKey('tab');
    // return browser.executeScript('arguments[0].blur()', this.element);
  }

  async clear(): Promise<void> {
    return await this.tc.typeText(this.element, '');
  }

  async click(...args: [] | ['center'] | [number, number]): Promise<void> {
    return this.tc.click(this.element);
    // await this._dispatchClickEventSequence(args);
  }

  async rightClick(...args: [] | ['center'] | [number, number]): Promise<void> {
    return this.tc.rightClick(this.element);
    // await this._dispatchClickEventSequence(args, Button.RIGHT);
  }

  async focus(): Promise<void> {
    const focus = ClientFunction(async () => {
      document.getElementById(await this.element.id).focus();
    });

    await focus();
    // return browser.executeScript('arguments[0].focus()', this.element);
  }

  async getCssValue(property: string): Promise<string> {
    return this.element.getStyleProperty(property);
  }

  async hover(): Promise<void> {
    return await this.tc.hover(this.element);
  }

  async mouseAway(): Promise<void> {
    return null;
    // return browser
    //   .actions()
    //   // .mouseMove(await this.element.getWebElement(), { x: -1, y: -1 })
    // .perform();
  }

  async sendKeys(...keys: (string | TestKey)[]): Promise<void>;
  async sendKeys(
    modifiers: ModifierKeys,
    ...keys: (string | TestKey)[]
  ): Promise<void>;
  async sendKeys(...modifiersAndKeys: any[]): Promise<void> {
    const first = modifiersAndKeys[0];
    let modifiers: ModifierKeys;
    let rest: (string | TestKey)[];
    if (typeof first !== 'string' && typeof first !== 'number') {
      modifiers = first;
      rest = modifiersAndKeys.slice(1);
    } else {
      modifiers = {};
      rest = modifiersAndKeys;
    }

    const modifierKeys = toTestCafeModifierKeys(modifiers);
    const keys = rest
      .map((k) => (typeof k === 'string' ? k.split('') : [keyMap[k]]))
      .reduce((arr, k) => arr.concat(k), [])
      // Key.chord doesn't work well with geckodriver (mozilla/geckodriver#1502),
      // so avoid it if no modifier keys are required.
      .map((k) =>
        modifierKeys.length > 0 ? Key.chord(...modifierKeys, k) : k
      );

    return keys.forEach(async (k) => {
      await this.tc.typeText(this.element, k);
    });
  }

  async text(options?: TextOptions): Promise<string> {
    if (options?.exclude) {
      return browser.executeScript(
        _getTextWithExcludedElements,
        this.element,
        options.exclude
      );
    }
    return this.element.getText();
  }

  async getAttribute(name: string): Promise<string | null> {
    return browser.executeScript(
      `return arguments[0].getAttribute(arguments[1])`,
      this.element,
      name
    );
  }

  async hasClass(name: string): Promise<boolean> {
    const classes = (await this.getAttribute('class')) || '';
    return new Set(classes.split(/\s+/).filter((c) => c)).has(name);
  }

  async getDimensions(): Promise<ElementDimensions> {
    const { width, height } = await this.element.getSize();
    const { x: left, y: top } = await this.element.getLocation();
    return { width, height, left, top };
  }

  async getProperty(name: string): Promise<any> {
    return browser.executeScript(
      `return arguments[0][arguments[1]]`,
      this.element,
      name
    );
  }

  async setInputValue(value: string): Promise<void> {
    return browser.executeScript(
      `arguments[0].value = arguments[1]`,
      this.element,
      value
    );
  }

  async selectOptions(...optionIndexes: number[]): Promise<void> {
    const options = await this.element.all(by.css('option'));
    const indexes = new Set(optionIndexes); // Convert to a set to remove duplicates.

    if (options.length && indexes.size) {
      // Reset the value so all the selected states are cleared. We can
      // reuse the input-specific method since the logic is the same.
      await this.setInputValue('');

      for (let i = 0; i < options.length; i++) {
        if (indexes.has(i)) {
          // We have to hold the control key while clicking on options so that multiple can be
          // selected in multi-selection mode. The key doesn't do anything for single selection.
          await browser.actions().keyDown(Key.CONTROL).perform();
          await options[i].click();
          await browser.actions().keyUp(Key.CONTROL).perform();
        }
      }
    }
  }

  async matchesSelector(selector: string): Promise<boolean> {
    return browser.executeScript(
      `
          return (Element.prototype.matches ||
                  Element.prototype.msMatchesSelector).call(arguments[0], arguments[1])
          `,
      this.element,
      selector
    );
  }

  async isFocused(): Promise<boolean> {
    return this.element.equals(browser.driver.switchTo().activeElement());
  }

  async dispatchEvent(
    name: string,
    data?: Record<string, EventData>
  ): Promise<void> {
    return browser.executeScript(_dispatchEvent, name, this.element, data);
  }

  /** Dispatches all the events that are part of a click event sequence. */
  private async _dispatchClickEventSequence(
    args: [] | ['center'] | [number, number],
    button?: string
  ) {
    // Omitting the offset argument to mouseMove results in clicking the center.
    // This is the default behavior we want, so we use an empty array of offsetArgs if no args are
    // passed to this method.
    const offsetArgs = args.length === 2 ? [{ x: args[0], y: args[1] }] : [];

    await browser
      .actions()
      .mouseMove(await this.element.getWebElement(), ...offsetArgs)
      .click(button)
      .perform();
  }
}

/**
 * Dispatches an event with a particular name and data to an element.
 * Note that this needs to be a pure function, because it gets stringified by
 * TestCafe and is executed inside the browser.
 */
function _dispatchEvent(
  name: string,
  element: ElementFinder,
  data?: Record<string, EventData>
) {
  const event = document.createEvent('Event');
  event.initEvent(name);

  if (data) {
    // tslint:disable-next-line:ban Have to use `Object.assign` to preserve the original object.
    Object.assign(event, data);
  }

  // This type has a string index signature, so we cannot access it using a dotted property access.
  element['dispatchEvent'](event);
}
