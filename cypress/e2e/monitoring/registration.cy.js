describe('Authentication Flow', () => {

  before(() => {
    cy.writeFile('auth_api_status.txt', 'UNKNOWN');
  });

  it('Login Flow with Smart Diagnostic', () => {
    cy.viewport(1280, 800);

    // 1. ПЕРЕХВАТ API
    cy.intercept({ method: 'POST', url: '**/login**' }).as('apiAuth');

    // 2. ПЕРЕХОД НА СТРАНИЦУ
    cy.visit('https://triple-test.netlify.app/sign-in');
    
    cy.url().should('include', '/sign-in');

   // 3. ВВОД ЛОГИНА 
    cy.get('input[placeholder="Логин"]')
      .should('be.visible')
      .click() 
      .clear()
      .type(Cypress.env('LOGIN_EMAIL'), { delay: 100, log: false }); 

    cy.wait(500);

    // 4. ВВОД ПАРОЛЯ 
    cy.get('input[placeholder="Пароль"]')
      .should('be.visible')
      .click()
      .clear()
      .type(Cypress.env('LOGIN_PASSWORD'), { delay: 100, log: false });

    cy.wait(800); 

    // 5. КЛИК "ВОЙТИ"
    cy.get('button.sign-in-page__submit')
      .should('be.visible')
      .and('not.be.disabled') 
      .click({ force: true });

    // 6. УМНАЯ ПРОВЕРКА ОТВЕТА СЕРВЕРА
    cy.wait('@apiAuth', { timeout: 15000 }).then((interception) => {
      const statusCode = interception.response?.statusCode || 500;
      cy.writeFile('auth_api_status.txt', statusCode.toString());

      if (statusCode >= 400) {
        throw new Error(`🆘 Ошибка сервера при авторизации: HTTP ${statusCode}`);
      }
    });

    // 7. ПРОВЕРКА УСПЕШНОГО ВХОДА (UI)
    cy.url({ timeout: 20000 }).should('not.include', '/sign-in');
    cy.get('body')
      .should('not.contain', 'Неверный логин')
      .and('not.contain', 'Ошибка');
      
    cy.log('✅ Авторизация прошла успешно');
  });
});