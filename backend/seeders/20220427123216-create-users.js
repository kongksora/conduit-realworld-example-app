"use strict";

module.exports = {
  async up(queryInterface, _Sequelize) {
    const users = Array(5)
      .fill(null)
      .map((_, index) => ({
        username: `exampleUser${index + 1}`,
        email: `example${index + 1}@mail.com`,
        password: `examplePwd${index + 1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    await queryInterface.bulkInsert("Users", users, {});
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete("Users", null, {});
  },
};
