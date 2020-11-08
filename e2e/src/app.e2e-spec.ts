import { AngularSelector, waitForAngular } from 'testcafe-angular-selectors';

fixture `Book Collection`
  .page('https://miherlosev.github.io/e2e_angular/')
  .beforeEach(async t => {
    await waitForAngular();
  });

test('Login', async t => {
  const loginForm = AngularSelector('bc-login-form');

  await t
    .typeText(loginForm.find('#md-input-1'), 'test')
    .typeText(loginForm.find('#md-input-3'), 'test')
    .click(loginForm.find('.mat-button'));

    await loginForm
});
