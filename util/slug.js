import { faker } from "@faker-js/faker";

const slug = [faker.word.adverb(), faker.word.adjective(), faker.word.noun()].join("-");

console.log(slug);
