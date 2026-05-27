describe("Basic app tests", () => {
  test("score total works", () => {
    const scores = [3, 2, 3, 2, 3];
    const total = scores.reduce((sum, score) => sum + score, 0);
    expect(total).toBe(13);
  });
});