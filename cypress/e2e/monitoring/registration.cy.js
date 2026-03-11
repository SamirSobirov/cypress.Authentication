describe('Authentication Flow', () => {

  before(() => {
    // Чистим файл перед стартом
    cy.writeFile('auth_api_status.txt', 'UNKNOWN');
  });

  it('Login Flow with Smart Diagnostic', () => {
    cy.viewport(1280, 800);

    // 1. ПЕРЕХВАТ API (Важно: проверь точный URL логина в Network, если тест падает на 6 шаге)
    cy.intercept({ method: 'POST', url: '**/login**' }).as('apiAuth');

    // 2. ПЕРЕХОД НА СТРАНИЦУ
    // Добавляем timeout на загрузку самой страницы
    cy.visit('https://triple-test.netlify.app/sign-in', { timeout: 30000 });
    
    // Ждем появления формы, прежде чем что-то искать
    cy.get('body').should('be.visible');
    cy.url().should('include', '/sign-in');

    // 3. ВВОД ЛОГИНА 
    // Добавлена проверка существования (exist) и увеличенный таймаут
    cy.get('input[placeholder="Логин"]', { timeout: 15000 })
      .should('exist')
      .and('be.visible')
      .click({ force: true }) // Force поможет, если элемент перекрыт
      .clear()
      .type(Cypress.env('LOGIN_EMAIL'), { delay: 100, log: false }); 

    cy.wait(500);

    // 4. ВВОД ПАРОЛЯ 
    cy.get('input[placeholder="Пароль"]', { timeout: 10000 })
      .should('be.visible')
      .click({ force: true })
      .clear()
      .type(Cypress.env('LOGIN_PASSWORD'), { delay: 100, log: false });

    cy.wait(1000); 

    // 5. КЛИК "ВОЙТИ"
    // Используем класс из твоего скриншота image_a748ca.png
    cy.get('button.sign-in-page__submit')
      .should('be.visible')
      .click({ force: true });

    // 6. УМНАЯ ПРОВЕРКА ОТВЕТА СЕРВЕРА
    // Если тест падает здесь, значит клик прошел, но запрос на сервер не улетел
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