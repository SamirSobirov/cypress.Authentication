describe('Authentication Flow', () => {

  before(() => {
    cy.writeFile('auth_api_status.txt', 'UNKNOWN');
  });

  it('Login Flow with Smart Diagnostic', () => {
    cy.viewport(1280, 800);

    // 1. ПЕРЕХВАТ API (Важно: перехватываем ДО визита на страницу)
    cy.intercept('POST', '**/login**').as('apiAuth');

    // 2. ПЕРЕХОД НА СТРАНИЦУ
    cy.visit('https://triple-test.netlify.app/sign-in', { timeout: 30000 });
    
    // Ждем, пока URL станет правильным и страница прогрузится
    cy.url().should('include', '/sign-in');
    cy.get('body').should('be.visible');

    // 3. ВВОД ЛОГИНА (Используем тип поля вместо плейсхолдера для надежности в CI)
    cy.get('input[type="text"]', { timeout: 15000 })
      .should('be.visible')
      .focus()
      .clear()
      .type(Cypress.env('LOGIN_EMAIL'), { delay: 50, log: false }); 

    // 4. ВВОД ПАРОЛЯ 
    cy.get('input[type="password"]')
      .should('be.visible')
      .focus()
      .clear()
      .type(Cypress.env('LOGIN_PASSWORD'), { delay: 50, log: false });

    cy.wait(1000); 

    // 5. КЛИК "ВОЙТИ"
    // Используем класс .sign-in-page__submit, который мы видели в коде
    cy.get('button.sign-in-page__submit')
      .should('be.visible')
      .click({ force: true });

    // 6. УМНАЯ ПРОВЕРКА ОТВЕТА СЕРВЕРА
    cy.wait('@apiAuth', { timeout: 20000 }).then((interception) => {
      const statusCode = interception.response?.statusCode || 500;
      cy.writeFile('auth_api_status.txt', statusCode.toString());

      if (statusCode >= 400) {
        throw new Error(`🆘 Ошибка сервера при авторизации: HTTP ${statusCode}`);
      }
    });

    // 7. ПРОВЕРКА УСПЕШНОГО ВХОДА
    cy.url({ timeout: 20000 }).should('not.include', '/sign-in');
    cy.log('✅ Авторизация прошла успешно');
  });
});