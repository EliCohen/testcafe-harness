import {
  HarnessEnvironment,
  HarnessLoader,
  TestElement,
} from '@angular/cdk/testing';
import {
  element as protractorElement,
  ElementArrayFinder,
} from 'protractor';
import { ProtractorElement } from './protractor-element';
import { Selector } from 'testcafe';

/** Options to configure the environment. */
export interface TestCafeHarnessEnvironmentOptions {
  /** The query function used to find DOM elements. */
  queryFn: (selector: string, root: Selector) => ElementArrayFinder;
}

/** The default environment options. */
const defaultEnvironmentOptions: TestCafeHarnessEnvironmentOptions = {
  queryFn: (selector: string, root: Selector) => root.find(selector),
};

/** A `HarnessEnvironment` implementation for TestCafe. */
export class TestCafeHarnessEnvironment extends HarnessEnvironment<Selector> {
  /** The options for this environment. */
  private _options: TestCafeHarnessEnvironmentOptions;

  protected constructor(
    rawRootElement: Selector,
    options?: TestCafeHarnessEnvironmentOptions
  ) {
    super(rawRootElement);
    this._options = { ...defaultEnvironmentOptions, ...options };
  }

  /** Creates a `HarnessLoader` rooted at the document root. */
  static loader(options?: TestCafeHarnessEnvironmentOptions): HarnessLoader {
    return new TestCafeHarnessEnvironment(
      Selector('body'),
      options
    );
  }

  async forceStabilize(): Promise<void> {}

  async waitForTasksOutsideAngular(): Promise<void> {
    // TODO: figure out how we can do this for the TestCafe environment.
    // https://github.com/angular/components/issues/17412
  }

  protected getDocumentRoot(): Selector {
    return Selector('body');
  }

  protected createTestElement(element: Selector): TestElement {
    return new ProtractorElement(element);
  }

  protected createEnvironment(element: Selector): HarnessEnvironment<Selector> {
    return new TestCafeHarnessEnvironment(element, this._options);
  }

  protected async getAllRawElements(selector: string): Promise<Selector[]> {
    const elementArrayFinder = this._options.queryFn(
      selector,
      this.rawRootElement
    );
    const length = await elementArrayFinder.count();
    const elements: Selector[] = [];
    for (let i = 0; i < length; i++) {
      elements.push(elementArrayFinder.get(i));
    }
    return elements;
  }
}
