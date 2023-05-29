const faker = require("@faker-js/faker").fakerID_ID;

console.log(
  Array.from({ length: 10 }).map(() => ({
    name: faker.person.fullName(),
    qrId: faker.phone.imei(),
  }))
);
