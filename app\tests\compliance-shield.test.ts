import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canSendReminder } from '../src/lib/compliance/shield.ts';

const ORG_ID = 'org-001';
const CUSTOMER_ID = 'cust-001';
const BUSINESS_HOURS_MONDAY = new Date('2026-06-01T14:00:00.000Z');

type TableName = 'organizations' | 'customers' | 'reminders' | 'disputes' | 'conversations';

interface FakeData {
  org?: {
    id: string;
    timezone: string;
    max_touches_per_week: number;
  };
  customer?: {
    id: string;
    org_id: string;
    name: string;
    strategic_flag: boolean;
    renewal_date: string | null;
  };
  reminderCount?: number;
  disputeCount?: number;
  suppressedConversationCount?: number;
}

class FakeQuery {
  private readonly table: TableName;
  private readonly data: FakeData;

  constructor(table: TableName, data: FakeData) {
    this.table = table;
    this.data = data;
  }

  select() {
    return this;
  }

  eq() {
    return this;
  }

  gte() {
    return this;
  }

  async single() {
    if (this.table === 'organizations') {
      return { data: this.data.org || null };
    }

    if (this.table === 'customers') {
      return { data: this.data.customer || null };
    }

    return { data: null };
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.resolveCount().then(onfulfilled, onrejected);
  }

  private async resolveCount() {
    if (this.table === 'reminders') {
      return { count: this.data.reminderCount || 0 };
    }

    if (this.table === 'disputes') {
      return { count: this.data.disputeCount || 0 };
    }

    if (this.table === 'conversations') {
      return { count: this.data.suppressedConversationCount || 0 };
    }

    return { count: 0 };
  }
}

function createFakeSupabase(overrides: Partial<FakeData> = {}) {
  const data: FakeData = {
    org: {
      id: ORG_ID,
      timezone: 'America/New_York',
      max_touches_per_week: 3,
    },
    customer: {
      id: CUSTOMER_ID,
      org_id: ORG_ID,
      name: 'Acme Co',
      strategic_flag: false,
      renewal_date: null,
    },
    reminderCount: 0,
    disputeCount: 0,
    suppressedConversationCount: 0,
    ...overrides,
  };

  return {
    from(table: TableName) {
      return new FakeQuery(table, data);
    },
  };
}

function runShield(overrides: Partial<FakeData>, nowOverride = BUSINESS_HOURS_MONDAY) {
  return canSendReminder({
    customerId: CUSTOMER_ID,
    orgId: ORG_ID,
    nowOverride,
    supabaseOverride: createFakeSupabase(overrides),
  });
}

describe('canSendReminder', () => {
  it('allows sends during business hours when no guardrails are triggered', async () => {
    const result = await runShield({});

    assert.equal(result.allowed, true);
    assert.equal(result.blockedBy, null);
  });

  it('blocks sends before the allowed local sending window', async () => {
    const result = await runShield({}, new Date('2026-06-01T11:00:00.000Z'));

    assert.equal(result.allowed, false);
    assert.equal(result.blockedBy, 'curfew');
  });

  it('blocks sends on weekends in the organization timezone', async () => {
    const result = await runShield({}, new Date('2026-06-06T14:00:00.000Z'));

    assert.equal(result.allowed, false);
    assert.equal(result.blockedBy, 'curfew');
    assert.match(result.details || '', /weekends/i);
  });

  it('blocks sends when the weekly frequency cap has been reached', async () => {
    const result = await runShield({ reminderCount: 3 });

    assert.equal(result.allowed, false);
    assert.equal(result.blockedBy, 'frequency_cap');
  });

  it('blocks sends while the customer has an active dispute', async () => {
    const result = await runShield({ disputeCount: 1 });

    assert.equal(result.allowed, false);
    assert.equal(result.blockedBy, 'active_dispute');
  });

  it('blocks sends for suppressed conversations', async () => {
    const result = await runShield({ suppressedConversationCount: 1 });

    assert.equal(result.allowed, false);
    assert.equal(result.blockedBy, 'suppressed');
  });

  it('blocks automated sends near a strategic renewal date', async () => {
    const result = await runShield({
      customer: {
        id: CUSTOMER_ID,
        org_id: ORG_ID,
        name: 'Acme Co',
        strategic_flag: true,
        renewal_date: '2026-07-01',
      },
    });

    assert.equal(result.allowed, false);
    assert.equal(result.blockedBy, 'strategic_hold');
  });
});
