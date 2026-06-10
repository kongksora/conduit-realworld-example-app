const request = require("supertest");
const { app, sequelize } = require("../app");

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

let token;
let articleSlug;
let commentId;

const testUser = {
  user: {
    username: "testuser",
    email: "testuser@mail.com",
    password: "testpass123",
  },
};

describe("Conduit API", () => {
  // ─── Auth ────────────────────────────────────────────────
  describe("POST /api/users — Sign Up", () => {
    it("should register a new user (201)", async () => {
      const res = await request(app)
        .post("/api/users")
        .send(testUser)
        .expect(201);

      expect(res.body.user).toHaveProperty("username", "testuser");
      expect(res.body.user).toHaveProperty("email", "testuser@mail.com");
      expect(res.body.user).toHaveProperty("token");
      expect(res.body.user).not.toHaveProperty("password");
    });

    it("should reject duplicate email (422)", async () => {
      const res = await request(app)
        .post("/api/users")
        .send(testUser)
        .expect(422);

      expect(res.body.errors.body[0]).toMatch(/already exists/i);
    });

    it("should reject missing username (422)", async () => {
      const res = await request(app)
        .post("/api/users")
        .send({ user: { email: "x@x.com", password: "pwd" } })
        .expect(422);

      expect(res.body.errors.body[0]).toMatch(/username/i);
    });

    it("should reject missing email (422)", async () => {
      const res = await request(app)
        .post("/api/users")
        .send({ user: { username: "x", password: "pwd" } })
        .expect(422);

      expect(res.body.errors.body[0]).toMatch(/email/i);
    });

    it("should reject missing password (422)", async () => {
      const res = await request(app)
        .post("/api/users")
        .send({ user: { username: "x", email: "x@x.com" } })
        .expect(422);

      expect(res.body.errors.body[0]).toMatch(/password/i);
    });
  });

  describe("POST /api/users/login — Sign In", () => {
    it("should login with correct credentials (200)", async () => {
      const res = await request(app)
        .post("/api/users/login")
        .send(testUser)
        .expect(200);

      expect(res.body.user).toHaveProperty("token");
      expect(res.body.user).toHaveProperty("email", "testuser@mail.com");
      token = res.body.user.token;
    });

    it("should reject non-existent email (404)", async () => {
      const res = await request(app)
        .post("/api/users/login")
        .send({ user: { email: "no@no.com", password: "x" } })
        .expect(404);

      expect(res.body.errors.body[0]).toMatch(/sign in first/i);
    });

    it("should reject wrong password (422)", async () => {
      const res = await request(app)
        .post("/api/users/login")
        .send({ user: { email: "testuser@mail.com", password: "wrong" } })
        .expect(422);

      expect(res.body.errors.body[0]).toMatch(/wrong/i);
    });
  });

  // ─── Current User ────────────────────────────────────────
  describe("GET /api/user — Current User", () => {
    it("should return current user with token (200)", async () => {
      const res = await request(app)
        .get("/api/user")
        .set("Authorization", `Token ${token}`)
        .expect(200);

      expect(res.body.user).toHaveProperty("username", "testuser");
    });

    it("should return user (no token) without crashing (200)", async () => {
      // verifyToken middleware calls next() when no auth header; currentUser throws UnauthorizedError if loggedUser missing
      const res = await request(app).get("/api/user").expect(401);

      expect(res.body.errors.body[0]).toMatch(/login/i);
    });
  });

  describe("PUT /api/user — Update User", () => {
    it("should update bio and image (200)", async () => {
      const res = await request(app)
        .put("/api/user")
        .set("Authorization", `Token ${token}`)
        .send({
          user: { bio: "Hello world", image: "https://example.com/pic.png", password: "newpass456" },
        })
        .expect(200);

      expect(res.body.user).toHaveProperty("bio", "Hello world");
      expect(res.body.user).toHaveProperty("image", "https://example.com/pic.png");
    });
  });

  // ─── Profiles ────────────────────────────────────────────
  let profileUserToken;

  beforeAll(async () => {
    // Register a second user for profile/follow tests
    const res = await request(app)
      .post("/api/users")
      .send({
        user: {
          username: "profileuser",
          email: "profile@mail.com",
          password: "profilepass",
        },
      });
    profileUserToken = res.body.user.token;
  });

  describe("GET /api/profiles/:username — Get Profile", () => {
    it("should return a profile without auth (200)", async () => {
      const res = await request(app)
        .get("/api/profiles/profileuser")
        .expect(200);

      expect(res.body.profile).toHaveProperty("username", "profileuser");
      expect(res.body.profile).not.toHaveProperty("email");
    });

    it("should return 404 for unknown user", async () => {
      const res = await request(app)
        .get("/api/profiles/nonexistent")
        .expect(404);

      expect(res.body.errors.body[0]).toMatch(/User profile/i);
    });
  });

  describe("POST /api/profiles/:username/follow — Follow", () => {
    it("should follow a profile (200)", async () => {
      const res = await request(app)
        .post("/api/profiles/profileuser/follow")
        .set("Authorization", `Token ${token}`)
        .expect(200);

      expect(res.body.profile).toHaveProperty("following", true);
      expect(res.body.profile).toHaveProperty("followersCount", 1);
    });
  });

  describe("DELETE /api/profiles/:username/follow — Unfollow", () => {
    it("should unfollow a profile (200)", async () => {
      const res = await request(app)
        .delete("/api/profiles/profileuser/follow")
        .set("Authorization", `Token ${token}`)
        .expect(200);

      expect(res.body.profile).toHaveProperty("following", false);
      expect(res.body.profile).toHaveProperty("followersCount", 0);
    });
  });

  // ─── Articles ────────────────────────────────────────────
  describe("POST /api/articles — Create Article", () => {
    it("should create a new article (201)", async () => {
      const res = await request(app)
        .post("/api/articles")
        .set("Authorization", `Token ${token}`)
        .send({
          article: {
            title: "Test Article",
            description: "A test article",
            body: "Lorem ipsum dolor sit amet.",
            tagList: ["test", "javascript"],
          },
        })
        .expect(201);

      expect(res.body.article).toHaveProperty("title", "Test Article");
      expect(res.body.article).toHaveProperty("slug", "test-article");
      expect(res.body.article).toHaveProperty("favorited", false);
      expect(res.body.article).toHaveProperty("favoritesCount", 0);
      expect(res.body.article.tagList).toEqual(
        expect.arrayContaining(["test", "javascript"]),
      );
      articleSlug = res.body.article.slug;
    });

    it("should reject missing title (422)", async () => {
      const res = await request(app)
        .post("/api/articles")
        .set("Authorization", `Token ${token}`)
        .send({ article: { description: "desc", body: "body" } })
        .expect(422);

      expect(res.body.errors.body[0]).toMatch(/title/i);
    });

    it("should reject without auth (401)", async () => {
      const res = await request(app)
        .post("/api/articles")
        .send({
          article: { title: "X", description: "D", body: "B" },
        })
        .expect(401);

      expect(res.body.errors.body[0]).toMatch(/login/i);
    });
  });

  describe("GET /api/articles — All Articles", () => {
    it("should return paginated articles (200)", async () => {
      const res = await request(app).get("/api/articles").expect(200);

      expect(res.body).toHaveProperty("articles");
      expect(res.body).toHaveProperty("articlesCount");
      expect(Array.isArray(res.body.articles)).toBe(true);
      expect(res.body.articlesCount).toBeGreaterThanOrEqual(1);
    });

    it("should filter by tag (200)", async () => {
      const res = await request(app)
        .get("/api/articles?tag=javascript")
        .expect(200);

      expect(res.body.articlesCount).toBeGreaterThanOrEqual(1);
      res.body.articles.forEach((a) => {
        expect(a.tagList).toContain("javascript");
      });
    });

    it("should filter by author (200)", async () => {
      const res = await request(app)
        .get("/api/articles?author=testuser")
        .expect(200);

      expect(res.body.articlesCount).toBeGreaterThanOrEqual(1);
      res.body.articles.forEach((a) => {
        expect(a.author.username).toBe("testuser");
      });
    });
  });

  describe("GET /api/articles/feed — Feed", () => {
    it("should return feed for following (200)", async () => {
      // First follow profileuser to have something in feed
      await request(app)
        .post("/api/profiles/profileuser/follow")
        .set("Authorization", `Token ${token}`);

      const res = await request(app)
        .get("/api/articles/feed")
        .set("Authorization", `Token ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty("articles");
      expect(res.body).toHaveProperty("articlesCount");
    });
  });

  describe("GET /api/articles/:slug — Single Article", () => {
    it("should return article by slug (200)", async () => {
      const res = await request(app)
        .get(`/api/articles/${articleSlug}`)
        .expect(200);

      expect(res.body.article).toHaveProperty("slug", articleSlug);
      expect(res.body.article).toHaveProperty("title", "Test Article");
      expect(res.body.article.author).toHaveProperty("username", "testuser");
    });

    it("should return 404 for unknown slug", async () => {
      const res = await request(app)
        .get("/api/articles/nonexistent-slug")
        .expect(404);

      expect(res.body.errors.body[0]).toMatch(/Article/i);
    });
  });

  describe("PUT /api/articles/:slug — Update Article", () => {
    it("should update article title (200)", async () => {
      const res = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .set("Authorization", `Token ${token}`)
        .send({ article: { title: "Updated Title" } })
        .expect(200);

      expect(res.body.article).toHaveProperty("title", "Updated Title");
      expect(res.body.article).toHaveProperty("slug", "updated-title");
      // update the slug ref since title change changes slug
      articleSlug = res.body.article.slug;
    });

    it("should reject update from non-author (403)", async () => {
      const res = await request(app)
        .put(`/api/articles/${articleSlug}`)
        .set("Authorization", `Token ${profileUserToken}`)
        .send({ article: { title: "Hijacked" } })
        .expect(403);

      expect(res.body.errors.body[0]).toMatch(/not the author/i);
    });
  });

  // ─── Favorites ───────────────────────────────────────────
  describe("POST /api/articles/:slug/favorite — Favorite", () => {
    it("should favorite an article (200)", async () => {
      const res = await request(app)
        .post(`/api/articles/${articleSlug}/favorite`)
        .set("Authorization", `Token ${token}`)
        .expect(200);

      expect(res.body.article).toHaveProperty("favorited", true);
      expect(res.body.article).toHaveProperty("favoritesCount", 1);
    });
  });

  describe("DELETE /api/articles/:slug/favorite — Unfavorite", () => {
    it("should unfavorite an article (200)", async () => {
      const res = await request(app)
        .delete(`/api/articles/${articleSlug}/favorite`)
        .set("Authorization", `Token ${token}`)
        .expect(200);

      expect(res.body.article).toHaveProperty("favorited", false);
      expect(res.body.article).toHaveProperty("favoritesCount", 0);
    });
  });

  // ─── Comments ────────────────────────────────────────────
  describe("POST /api/articles/:slug/comments — Create Comment", () => {
    it("should create a comment (201)", async () => {
      const res = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set("Authorization", `Token ${token}`)
        .send({ comment: { body: "Great article!" } })
        .expect(201);

      expect(res.body.comment).toHaveProperty("body", "Great article!");
      expect(res.body.comment.author).toHaveProperty("username", "testuser");
      commentId = res.body.comment.id;
    });

    it("should reject empty body (422)", async () => {
      const res = await request(app)
        .post(`/api/articles/${articleSlug}/comments`)
        .set("Authorization", `Token ${token}`)
        .send({ comment: { body: "" } })
        .expect(422);

      expect(res.body.errors.body[0]).toMatch(/body/i);
    });
  });

  describe("GET /api/articles/:slug/comments — All Comments", () => {
    it("should list article comments (200)", async () => {
      const res = await request(app)
        .get(`/api/articles/${articleSlug}/comments`)
        .expect(200);

      expect(res.body).toHaveProperty("comments");
      expect(res.body.comments.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("DELETE /api/articles/:slug/comments/:id — Delete Comment", () => {
    it("should delete own comment (200)", async () => {
      const res = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set("Authorization", `Token ${token}`)
        .expect(200);

      expect(res.body.message.body[0]).toMatch(/deleted/i);
    });

    it("should return 404 for deleted comment", async () => {
      const res = await request(app)
        .delete(`/api/articles/${articleSlug}/comments/${commentId}`)
        .set("Authorization", `Token ${token}`)
        .expect(404);

      expect(res.body.errors.body[0]).toMatch(/Comment/i);
    });
  });

  // ─── Tags ────────────────────────────────────────────────
  describe("GET /api/tags — Tags", () => {
    it("should return tag list (200)", async () => {
      const res = await request(app).get("/api/tags").expect(200);

      expect(res.body).toHaveProperty("tags");
      expect(Array.isArray(res.body.tags)).toBe(true);
      expect(res.body.tags).toEqual(
        expect.arrayContaining(["test", "javascript"]),
      );
    });
  });

  // ─── Delete Article ──────────────────────────────────────
  describe("DELETE /api/articles/:slug — Delete Article", () => {
    it("should reject delete from non-author (403)", async () => {
      const res = await request(app)
        .delete(`/api/articles/${articleSlug}`)
        .set("Authorization", `Token ${profileUserToken}`)
        .expect(403);

      expect(res.body.errors.body[0]).toMatch(/not the author/i);
    });

    it("should delete own article (200)", async () => {
      const res = await request(app)
        .delete(`/api/articles/${articleSlug}`)
        .set("Authorization", `Token ${token}`)
        .expect(200);

      expect(res.body.message.body[0]).toMatch(/deleted/i);
    });

    it("should return 404 for deleted article", async () => {
      await request(app).get(`/api/articles/${articleSlug}`).expect(404);
    });
  });
});
