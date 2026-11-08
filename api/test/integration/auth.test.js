import request from "supertest";
import app from "../../app.js";
import { createTokens } from "../../functions/token.js";

const agent = request.agent(app); // the cookies are saved and redirected automatically

let accessToken;
let refreshToken;

let username = Math.random().toString().substring(2, 15);

describe("Endpoints /auth", () => {
  describe("User creation test", () => {
    it("POST /auth/register - Create User", async () => {
      const res = await agent
        .post("/auth/register")
        .send({ name: "Rodrigo", username: username, password: "12345678" });
      expect(res.status).toEqual(201);
      expect(res.type).toEqual("application/json");
      expect(res.body).toEqual({});
    });

    it("POST /auth/register - Create User with invalid body", async () => {
      const res = await agent.post("/auth/register").send({
        name: "Rodrigo",
        username: username,
        password: "12345678",
        opr: "create",
      });
      expect(res.status).toEqual(400);
      expect(res.type).toEqual("application/json");
      expect(res.body).toHaveProperty("message");
    });

    it("POST /auth/register -  Unavailable Username", async () => {
      const res = await agent
        .post("/auth/register")
        .send({ name: "Rodrigo", username: username, password: "12345678" });
      expect(res.status).toEqual(409);
      expect(res.type).toEqual("application/json");
      expect(res.body).toEqual({
        message: "Unavailable username",
        username: username,
      });
    });
  });

  it("POST /auth/login - Login User with invalid body", async () => {
    const res = await agent
      .post("/auth/login")
      .send({ name: "Rodrigo", password: "12345678" });
    expect(res.status).toEqual(400);
    expect(res.type).toEqual("application/json");
    expect(res.body).toHaveProperty("message");
  });

  describe("User authentication test", () => {
    it("POST /auth/login - Grant Access", async () => {
      const res = await agent
        .post("/auth/login")
        .send({ username: username, password: "12345678" });
      expect(res.status).toEqual(200);
      expect(res.type).toEqual("application/json");
      expect(res.body).toHaveProperty("accessToken");
      expect(res.headers["set-cookie"][0]).toContain("refreshToken=");

      accessToken = res.body.accessToken;
      refreshToken = res.headers["set-cookie"][0].split(";")[0].split("=")[1];
    });

    it("POST /auth/login - Nonexistent User test", async () => {
      const res = await agent
        .post("/auth/login")
        .send({ username: "naoExiste", password: "12345678" });
      expect(res.status).toEqual(401);
      expect(res.type).toEqual("application/json");
      expect(res.body).toEqual({
        message: "Not authorized",
      });
    });

    it("POST /auth/login - Wrong password test", async () => {
      const res = await agent
        .post("/auth/login")
        .send({ username: username, password: "87654321" });
      expect(res.status).toEqual(401);
      expect(res.type).toEqual("application/json");
      expect(res.body).toEqual({
        message: "Not authorized",
      });
    });

    describe("Check token lifecycle", () => {
      it("Get /product - Without accessToken test", async () => {
        const res = await agent.get("/product");
        expect(res.status).toEqual(401);
        expect(res.type).toEqual("application/json");
        expect(res.body).toEqual({
          message: "Token not provided",
        });
      });

      it("Invalid accessToken test", async () => {
        const res = await agent.get("/product").set({
          Authorization: "Bearer " + accessToken + "123",
        });
        expect(res.status).toEqual(401);
        expect(res.type).toEqual("application/json");
        expect(res.body).toEqual({
          message: "Invalid token",
        });
      });

      it("Valid accessToken test", async () => {
        const res = await agent.get("/product").set({
          Authorization: "Bearer " + accessToken,
        });
        expect(res.status).toEqual(200);
        expect(res.type).toEqual("application/json");
        expect(res.body).toEqual({
          products: [],
        });
      });

      it("Expired accessToken test", async () => {
        let expiredAccessToken = createTokens(username, 0).accessToken;
        const res = await agent.get("/product").set({
          Authorization: "Bearer " + expiredAccessToken,
        });
        expect(res.status).toEqual(401);
        expect(res.type).toEqual("application/json");
        expect(res.body).toEqual({
          message: "Expired token",
        });
      });

      it("RefreshToken used as accessToken ", async () => {
        const res = await agent.get("/product").set({
          Authorization: "Bearer " + refreshToken,
        });
        expect(res.status).toEqual(401);
        expect(res.type).toEqual("application/json");
        expect(res.body).toEqual({
          message: "Invalid token",
        });
      });

      it("GET /auth/refresh - Create new Access/Refresh tokens test", async () => {
        const res = await agent.get("/auth/refresh");
        expect(res.status).toEqual(200);
        expect(res.type).toEqual("application/json");
        expect(res.body).toHaveProperty("accessToken");
        expect(res.headers["set-cookie"][0]).toContain("refreshToken=");
        expect(res.body.accessToken).not.toEqual(accessToken);
        expect(
          res.headers["set-cookie"][0].split(";")[0].split("=")[1],
        ).not.toEqual(refreshToken);
      });

      it("GET /auth/refresh - Verify if old refreshToken got invalid test", async () => {
        const agent = request.agent(app); //Needed a new agent object to set manually an old refreshToken
        const res = await agent
          .get("/auth/refresh")
          .set("Cookie", `refreshToken=${refreshToken}`);
        expect(res.status).toEqual(401);
        expect(res.type).toEqual("application/json");
        expect(res.body).toEqual({ message: "Not authorized" });
      });
    });
  });
});
