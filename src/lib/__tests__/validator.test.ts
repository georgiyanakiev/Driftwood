import { describe, it, expect } from 'vitest';
import { validate } from '../validator';

describe('Driftwood deterministic validator', () => {
  // -------------------------------------------------------
  // GOOD POSTS — these should all pass
  // -------------------------------------------------------
  describe('accepts on-brand content', () => {
    const goodPosts = [
      'We roasted a new blend this week. Tastes like brown sugar and a little bit of trouble.',
      'Cold brew season is here, if you\'re the kind of person who needs an excuse.',
      'Our Honduras lot is back. Same farmer, same careful process, still surprises us every time.',
      'Some mornings call for a pour-over. Today was one of those mornings.',
      'The new bags ship on Tuesday. Nothing fancy about the timeline, just coffee.',
      'We tried something different with this batch. Lighter roast, more fruit. See what you think.',
      'There is a reason we keep going back to this farm. The beans speak for themselves.',
      'Rainy mornings and a slow cup. That is the whole pitch.',
      'Our roaster has been at this for twelve years. Still gets a little nervous before a new batch.',
      'We source from three farms this season. Each one brings something we could not get elsewhere.',
    ];

    goodPosts.forEach((post) => {
      it(`passes: "${post.slice(0, 60)}..."`, () => {
        const result = validate(post);
        expect(result.passed).toBe(true);
        expect(result.violations).toHaveLength(0);
      });
    });
  });

  // -------------------------------------------------------
  // EXCLAMATION MARKS
  // -------------------------------------------------------
  describe('rejects exclamation marks', () => {
    it('catches a trailing exclamation', () => {
      const result = validate('Great coffee coming your way!');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.category === 'exclamation')).toBe(true);
    });

    it('catches mid-sentence exclamation', () => {
      const result = validate('Wow! This blend is really something.');
      expect(result.passed).toBe(false);
    });
  });

  // -------------------------------------------------------
  // EMOJI
  // -------------------------------------------------------
  describe('rejects emoji', () => {
    const emojiPosts = [
      'New beans are here 🔥',
      'Coffee time ☕',
      'Good morning ❤️',
      'Fresh roast 🫘 just dropped',
      'Feeling cozy 😊',
    ];

    emojiPosts.forEach((post) => {
      it(`catches emoji in: "${post}"`, () => {
        const result = validate(post);
        expect(result.passed).toBe(false);
        expect(result.violations.some((v) => v.category === 'emoji')).toBe(true);
      });
    });
  });

  // -------------------------------------------------------
  // ALL-CAPS HYPE
  // -------------------------------------------------------
  describe('rejects ALL-CAPS words', () => {
    it('catches BEST', () => {
      const result = validate('This is the BEST coffee.');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.category === 'all_caps_hype')).toBe(true);
    });

    it('catches AMAZING', () => {
      const result = validate('AMAZING new blend dropping.');
      expect(result.passed).toBe(false);
    });

    it('catches NEW', () => {
      const result = validate('Our NEW roast is here.');
      expect(result.passed).toBe(false);
    });

    it('allows common acronyms: AM, PM, FAQ, NYC', () => {
      expect(validate('Ships by 9 AM EST.').passed).toBe(true);
      expect(validate('Available PM only.').passed).toBe(true);
      expect(validate('Check our FAQ for details.').passed).toBe(true);
      expect(validate('Visit us in NYC.').passed).toBe(true);
    });
  });

  // -------------------------------------------------------
  // ABSOLUTE/GUARANTEE CLAIMS
  // -------------------------------------------------------
  describe('rejects absolute and guarantee claims', () => {
    const absolutePosts = [
      { post: 'Guaranteed to wake you up.', match: 'guarantee' },
      { post: '100% satisfaction on every bag.', match: '100 %' },
      { post: 'This is risk-free coffee.', match: 'risk-free' },
      { post: 'We make the best coffee in town.', match: 'the best' },
      { post: 'Rated #1 in the city.', match: '#' },
      { post: 'We are number one in quality.', match: 'number one' },
      { post: 'Unbeatable freshness in every cup.', match: 'unbeatable' },
      { post: 'Our quality is unmatched.', match: 'unmatched' },
      { post: 'A perfectly balanced cup.', match: 'perfect' },
      { post: 'Flawlessly roasted every time.', match: 'flawless' },
      { post: 'Nothing else comes close to this.', match: 'nothing' },
      { post: 'The world\'s finest beans.', match: 'world' },
      { post: 'The only coffee you need.', match: 'the only coffee' },
    ];

    absolutePosts.forEach(({ post, match }) => {
      it(`catches "${match}" in: "${post.slice(0, 50)}"`, () => {
        const result = validate(post);
        expect(result.passed).toBe(false);
        expect(result.violations.some((v) => v.category === 'absolute_claims')).toBe(true);
      });
    });
  });

  // -------------------------------------------------------
  // HARD-SELL URGENCY
  // -------------------------------------------------------
  describe('rejects hard-sell urgency', () => {
    const urgencyPosts = [
      'Buy now before they sell out.',
      'Limited time offer on all blends.',
      'Act now to get free shipping.',
      'Use code COFFEE20 for a discount.',
      'Order now and save.',
      'Don\'t miss out on this batch.',
      'Hurry, only a few bags left.',
      'While supplies last.',
      'Only 5 left in stock.',
      'Sale ends Friday.',
      'Exclusive offer for subscribers.',
      'Use discount code BREW.',
      'Promo code inside.',
      'Claim your free sample.',
      'For a limited period only.',
      'Last chance to grab this blend.',
      'Get yours before they are gone.',
      'Sign up now for early access.',
      'Subscribe now and never run out.',
    ];

    urgencyPosts.forEach((post) => {
      it(`catches urgency in: "${post.slice(0, 50)}"`, () => {
        const result = validate(post);
        expect(result.passed).toBe(false);
        expect(result.violations.some((v) => v.category === 'hard_sell_urgency')).toBe(true);
      });
    });
  });

  // -------------------------------------------------------
  // COMPETITOR NAMES
  // -------------------------------------------------------
  describe('rejects competitor names', () => {
    const competitors = [
      'Better than Starbucks.',
      'Unlike Dunkin, we care about sourcing.',
      'We are not Peet\'s.',
      'Move over, Blue Bottle.',
      'Intelligentsia has nothing on us.',
      'Stumptown who?',
      'Counter Culture is fine but we are different.',
      'Forget Nespresso pods.',
      'Not your Keurig coffee.',
      'Way better than Folgers.',
      'Maxwell House can not compete.',
      'Tim Hortons could never.',
      'Philz is great, but try this.',
    ];

    competitors.forEach((post) => {
      it(`catches competitor in: "${post.slice(0, 50)}"`, () => {
        const result = validate(post);
        expect(result.passed).toBe(false);
        expect(result.violations.some((v) => v.category === 'competitor_names')).toBe(true);
      });
    });
  });

  // -------------------------------------------------------
  // HASHTAGS
  // -------------------------------------------------------
  describe('rejects hashtags', () => {
    it('catches #coffee', () => {
      const result = validate('New roast is here. #coffee');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.category === 'hashtags')).toBe(true);
    });

    it('catches #blessed', () => {
      const result = validate('Love this job. #blessed');
      expect(result.passed).toBe(false);
    });

    it('does not flag #1 as a hashtag (caught by absolute_claims)', () => {
      const result = validate('Rated #1.');
      expect(result.passed).toBe(false);
      expect(result.violations.some((v) => v.category === 'absolute_claims')).toBe(true);
    });
  });

  // -------------------------------------------------------
  // MULTIPLE VIOLATIONS
  // -------------------------------------------------------
  describe('catches multiple violations at once', () => {
    it('catches exclamation + emoji + urgency + caps', () => {
      const result = validate('BUY NOW! 🔥 BEST coffee EVER!');
      expect(result.passed).toBe(false);
      const categories = result.violations.map((v) => v.category);
      expect(categories).toContain('exclamation');
      expect(categories).toContain('emoji');
      expect(categories).toContain('all_caps_hype');
    });

    it('catches competitor + absolute claim', () => {
      const result = validate('Better than Starbucks. We are the best.');
      expect(result.passed).toBe(false);
      const categories = result.violations.map((v) => v.category);
      expect(categories).toContain('competitor_names');
      expect(categories).toContain('absolute_claims');
    });
  });

  // -------------------------------------------------------
  // EDGE CASES — "bad day" model outputs
  // -------------------------------------------------------
  describe('bad-day model outputs (adversarial/weird)', () => {
    it('catches sneaky exclamation in parenthetical', () => {
      const result = validate('New beans are here (finally!)');
      expect(result.passed).toBe(false);
    });

    it('catches emoji hidden at end of sentence', () => {
      const result = validate('Coffee. That is all.☕');
      expect(result.passed).toBe(false);
    });

    it('catches guarantee with different capitalization', () => {
      const result = validate('GUARANTEED fresh or your money back.');
      expect(result.passed).toBe(false);
    });

    it('catches "the best" with extra spacing', () => {
      const result = validate('We make the  best coffee.');
      // Note: this has two spaces, but \s+ handles it
      const result2 = validate('We make the best coffee.');
      expect(result2.passed).toBe(false);
    });

    it('catches competitor name embedded in longer sentence', () => {
      const result = validate('We asked ourselves what starbucks would never do, and we did that.');
      expect(result.passed).toBe(false);
    });

    it('rejects model outputting only urgency phrases', () => {
      const result = validate('Limited time. Act now. Buy now.');
      expect(result.passed).toBe(false);
    });

    it('rejects model outputting marketing fluff', () => {
      const result = validate('You DESERVE the BEST! Order NOW and get 100% satisfaction GUARANTEED! 🎉');
      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(3);
    });
  });

  // -------------------------------------------------------
  // REGRESSION TESTS — real-world LLM outputs that slipped
  // -------------------------------------------------------
  describe('golden rejects (simulated model failures)', () => {
    const goldenRejects = [
      { output: 'Trust us, this is the best coffee you will ever try.', shouldCatch: 'absolute_claims' },
      { output: 'Better than anything Starbucks has ever made.', shouldCatch: 'competitor_names' },
      { output: 'Grab yours now! Only 10 bags left!', shouldCatch: 'hard_sell_urgency' },
      { output: 'INCREDIBLE new blend just dropped 🔥🔥🔥', shouldCatch: 'emoji' },
      { output: 'Use code DRIFTWOOD20 for your first bag.', shouldCatch: 'hard_sell_urgency' },
      { output: 'Perfectly roasted, flawlessly packaged, guaranteed delicious.', shouldCatch: 'absolute_claims' },
      { output: 'Don\'t miss out on our EXCLUSIVE holiday blend! #coffee #blessed', shouldCatch: 'hard_sell_urgency' },
    ];

    goldenRejects.forEach(({ output, shouldCatch }) => {
      it(`catches ${shouldCatch} in: "${output.slice(0, 50)}..."`, () => {
        const result = validate(output);
        expect(result.passed).toBe(false);
        expect(result.violations.some((v) => v.category === shouldCatch)).toBe(true);
      });
    });
  });
});
