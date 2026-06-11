/**
 * Smart Form Autofill Engine - API Edge Function
 * Full API: auth, profiles, forms/analyze, AI/classify, analytics
 * Thai/English rule engine + KV storage
 */

interface Env {
  AUTOFILL_KV?: KVNamespace;
}

interface ClassifiedField {
  name: string;
  semanticType: string;
  label: string;
  confidence: number;
}

// Thai/English field classification rule engine
const THAI_RULES: Record<string, { semanticType: string; keywords: string[] }> = {
  fullName: {
    semanticType: 'personal.fullName',
    keywords: ['ชื่อ-สกุล', 'ชื่อสกุล', 'ชื่อและนามสกุล', 'fullname', 'full_name'],
  },
  firstName: {
    semanticType: 'personal.firstName',
    keywords: ['ชื่อ', 'ชื่อต้น', 'firstname', 'first_name', 'name'],
  },
  lastName: {
    semanticType: 'personal.lastName',
    keywords: ['นามสกุล', 'สกุล', 'lastname', 'last_name', 'surname'],
  },
  nationalId: {
    semanticType: 'personal.nationalId',
    keywords: ['เลขบัตรประชาชน', 'บัตรประชาชน', 'รหัสประชาชน', 'nationalid', 'national_id', 'citizenid'],
  },
  address: {
    semanticType: 'address.street',
    keywords: ['ที่อยู่', 'ตำบล', 'อำเภอ', 'จังหวัด', 'address', 'street'],
  },
  phone: {
    semanticType: 'contact.phone',
    keywords: ['เบอร์โทร', 'หมายเลขโทรศัพท์', 'โทรศัพท์', 'phone', 'tel', 'mobile'],
  },
  email: {
    semanticType: 'contact.email',
    keywords: ['อีเมล', 'email', 'e-mail'],
  },
  dateOfBirth: {
    semanticType: 'personal.dateOfBirth',
    keywords: ['วันเกิด', 'วัน/เดือน/ปีเกิด', 'birthdate', 'dob', 'date_of_birth'],
  },
  companyName: {
    semanticType: 'work.companyName',
    keywords: ['ชื่อบริษัท', 'บริษัท', 'company', 'organization', 'employer'],
  },
  jobTitle: {
    semanticType: 'work.jobTitle',
    keywords: ['ตำแหน่ง', 'ตำแหน่งงาน', 'jobtitle', 'job_title', 'position'],
  },
};

const ENGLISH_RULES: Record<string, { semanticType: string; keywords: string[] }> = {
  fullName: {
    semanticType: 'personal.fullName',
    keywords: ['full name', 'fullname', 'full_name', 'name'],
  },
  firstName: {
    semanticType: 'personal.firstName',
    keywords: ['first name', 'firstname', 'first_name', 'given name', 'fname'],
  },
  lastName: {
    semanticType: 'personal.lastName',
    keywords: ['last name', 'lastname', 'last_name', 'surname', 'family name', 'lname'],
  },
  email: {
    semanticType: 'contact.email',
    keywords: ['email', 'e-mail', 'email address', 'mail'],
  },
  phone: {
    semanticType: 'contact.phone',
    keywords: ['phone', 'telephone', 'tel', 'mobile', 'cell', 'phone number'],
  },
  address: {
    semanticType: 'address.street',
    keywords: ['address', 'street', 'street address', 'address line'],
  },
  city: {
    semanticType: 'address.city',
    keywords: ['city', 'town', 'locality'],
  },
  state: {
    semanticType: 'address.state',
    keywords: ['state', 'province', 'region', 'county'],
  },
  zip: {
    semanticType: 'address.zip',
    keywords: ['zip', 'zipcode', 'zip code', 'postal', 'postal code', 'postcode'],
  },
  country: {
    semanticType: 'address.country',
    keywords: ['country', 'nation'],
  },
  company: {
    semanticType: 'work.companyName',
    keywords: ['company', 'organization', 'employer', 'firm'],
  },
  jobTitle: {
    semanticType: 'work.jobTitle',
    keywords: ['job title', 'position', 'title', 'role', 'occupation'],
  },
  dateOfBirth: {
    semanticType: 'personal.dateOfBirth',
    keywords: ['date of birth', 'dob', 'birthday', 'birthdate', 'born'],
  },
  nationalId: {
    semanticType: 'personal.nationalId',
    keywords: ['national id', 'ssn', 'social security', 'citizen id', 'id number'],
  },
  website: {
    semanticType: 'contact.website',
    keywords: ['website', 'url', 'web', 'homepage', 'site'],
  },
};

function classifyField(name: string, label: string, type: string): ClassifiedField {
  const normalizedName = name.toLowerCase().replace(/[-_]/g, ' ');
  const normalizedLabel = label.toLowerCase().replace(/[-_]/g, ' ');
  const combined = `${normalizedName} ${normalizedLabel}`;

  let bestMatch = { semanticType: 'unknown', confidence: 0, label: label || name };
  const allRules = { ...THAI_RULES, ...ENGLISH_RULES };

  for (const [, rule] of Object.entries(allRules)) {
    for (const keyword of rule.keywords) {
      if (combined.includes(keyword.toLowerCase())) {
        const confidence = keyword.length / combined.length > 0.5 ? 0.95 : 0.8;
        if (confidence > bestMatch.confidence) {
          bestMatch = { semanticType: rule.semanticType, confidence, label: label || name };
        }
      }
    }
  }

  // Type-based fallback
  if (bestMatch.confidence === 0) {
    const typeMap: Record<string, string> = {
      email: 'contact.email',
      tel: 'contact.phone',
      url: 'contact.website',
      date: 'personal.date',
      number: 'personal.number',
    };
    if (typeMap[type]) {
      bestMatch = { semanticType: typeMap[type], confidence: 0.6, label: label || name };
    }
  }

  return {
    name,
    semanticType: bestMatch.semanticType,
    label: bestMatch.label,
    confidence: bestMatch.confidence,
  };
}

function detectLanguage(fields: { name: string; label: string }[]): 'th' | 'en' | 'mixed' {
  let thaiCount = 0;
  let englishCount = 0;

  for (const field of fields) {
    const text = `${field.name} ${field.label}`.toLowerCase();
    const thaiRegex = /[\u0E00-\u0E7F]/;
    if (thaiRegex.test(text)) {
      thaiCount++;
    } else {
      englishCount++;
    }
  }

  if (thaiCount > 0 && englishCount > 0) return 'mixed';
  if (thaiCount > 0) return 'th';
  return 'en';
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers,
    },
  });
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '').replace(/\/+$/, '') || '/';
  const method = request.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }

  // --- Auth ---
  if (path === '/auth/login' && method === 'POST') {
    const body = await request.json() as { username?: string; password?: string };
    if (!body.username || !body.password) {
      return json({ success: false, error: 'Username and password required' }, 400);
    }
    // Demo: accept any credentials
    const token = btoa(`${body.username}:${Date.now()}`);
    return json({
      success: true,
      data: {
        token,
        userId: btoa(body.username),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
  }

  if (path === '/auth/register' && method === 'POST') {
    const body = await request.json() as { username?: string; password?: string };
    if (!body.username || !body.password) {
      return json({ success: false, error: 'Username and password required' }, 400);
    }
    const token = btoa(`${body.username}:${Date.now()}`);
    return json({
      success: true,
      data: {
        token,
        userId: btoa(body.username),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });
  }

  // --- Profiles ---
  if (path === '/profiles' && method === 'GET') {
    const kv = env.AUTOFILL_KV;
    if (kv) {
      const list = await kv.list({ prefix: 'profile:' });
      const profiles = [];
      for (const key of list.keys) {
        const data = await kv.get(key.name);
        if (data) profiles.push(JSON.parse(data));
      }
      return json({ success: true, data: profiles });
    }
    return json({ success: true, data: [] });
  }

  if (path === '/profiles' && method === 'POST') {
    const body = await request.json() as Record<string, unknown>;
    const kv = env.AUTOFILL_KV;
    const id = crypto.randomUUID();
    const profile = {
      id,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (kv) {
      await kv.put(`profile:${id}`, JSON.stringify(profile));
    }
    return json({ success: true, data: profile }, 201);
  }

  if (path.startsWith('/profiles/') && method === 'GET') {
    const id = path.replace('/profiles/', '');
    const kv = env.AUTOFILL_KV;
    if (kv) {
      const data = await kv.get(`profile:${id}`);
      if (data) return json({ success: true, data: JSON.parse(data) });
      return json({ success: false, error: 'Profile not found' }, 404);
    }
    return json({ success: false, error: 'Profile not found' }, 404);
  }

  if (path.startsWith('/profiles/') && method === 'PUT') {
    const id = path.replace('/profiles/', '');
    const body = await request.json() as Record<string, unknown>;
    const kv = env.AUTOFILL_KV;
    if (kv) {
      const existing = await kv.get(`profile:${id}`);
      if (!existing) return json({ success: false, error: 'Profile not found' }, 404);
      const updated = { ...JSON.parse(existing), ...body, updatedAt: new Date().toISOString() };
      await kv.put(`profile:${id}`, JSON.stringify(updated));
      return json({ success: true, data: updated });
    }
    return json({ success: false, error: 'KV not available' }, 500);
  }

  if (path.startsWith('/profiles/') && method === 'DELETE') {
    const id = path.replace('/profiles/', '');
    const kv = env.AUTOFILL_KV;
    if (kv) {
      await kv.delete(`profile:${id}`);
    }
    return json({ success: true });
  }

  // --- Forms Analyze ---
  if (path === '/forms/analyze' && method === 'POST') {
    const body = await request.json() as { fields?: Record<string, string>; url?: string };
    if (!body.fields) {
      return json({ success: false, error: 'Fields required' }, 400);
    }

    const fields = Object.entries(body.fields).map(([name, label]) => ({
      name,
      label,
      type: 'text',
    }));

    const language = detectLanguage(fields);
    const analyzed = fields.map(f => ({
      name: f.name,
      type: f.type,
      label: f.label,
      category: classifyField(f.name, f.label, f.type).semanticType.split('.')[0],
      required: false,
      autofillCompatible: classifyField(f.name, f.label, f.type).confidence > 0.5,
    }));

    const suggestions = analyzed
      .filter(f => f.autofillCompatible)
      .map(f => ({
        fieldName: f.name,
        profileField: f.category,
        confidence: 0.85,
        rule: language === 'th' ? 'thai-rule-engine' : 'english-rule-engine',
      }));

    const result = {
      formId: crypto.randomUUID(),
      url: body.url || '',
      fields: analyzed,
      suggestions,
      language,
      confidence: suggestions.length > 0 ? suggestions.reduce((s, x) => s + x.confidence, 0) / suggestions.length : 0,
    };

    // Track in KV
    const kv = env.AUTOFILL_KV;
    if (kv) {
      await kv.put(`analysis:${result.formId}`, JSON.stringify(result));
    }

    return json({ success: true, data: result });
  }

  // --- AI Classify ---
  if (path === '/AI/classify' && method === 'POST') {
    const body = await request.json() as { fields?: { name: string; label: string; type: string }[] };
    if (!body.fields || !Array.isArray(body.fields)) {
      return json({ success: false, error: 'Fields array required' }, 400);
    }

    const language = detectLanguage(body.fields);
    const classified = body.fields.map(f => classifyField(f.name, f.label, f.type));

    // Determine form type based on classified fields
    const semanticTypes = new Set(classified.map(f => f.semanticType));
    let formType = 'generic';
    let category = 'general';

    if (semanticTypes.has('personal.nationalId') && language === 'th') {
      formType = 'thai-government-form';
      category = 'government';
    } else if (semanticTypes.has('work.companyName') && semanticTypes.has('work.jobTitle')) {
      formType = 'job-application';
      category = 'employment';
    } else if (semanticTypes.has('address.street') && semanticTypes.has('contact.email') && !semanticTypes.has('work.companyName')) {
      formType = 'e-commerce-checkout';
      category = 'ecommerce';
    } else if (semanticTypes.has('personal.dateOfBirth') && semanticTypes.has('personal.nationalId')) {
      formType = 'bank-application';
      category = 'finance';
    }

    const avgConfidence = classified.length > 0 ? classified.reduce((s, f) => s + f.confidence, 0) / classified.length : 0;

    const result = {
      formType,
      category,
      language,
      fields: classified,
      confidence: avgConfidence,
    };

    return json({ success: true, data: result });
  }

  // --- Analytics ---
  if (path === '/analytics' && method === 'GET') {
    const kv = env.AUTOFILL_KV;
    if (kv) {
      const analysisKeys = await kv.list({ prefix: 'analysis:' });
      const profileKeys = await kv.list({ prefix: 'profile:' });
      const trackKeys = await kv.list({ prefix: 'track:' });

      return json({
        success: true,
        data: {
          totalAutofills: trackKeys.keys.length,
          totalAnalyses: analysisKeys.keys.length,
          totalClassifications: analysisKeys.keys.length,
          totalProfiles: profileKeys.keys.length,
          autofillsByDay: [],
          topFormTypes: [],
          languageDistribution: [],
          averageConfidence: 0.85,
        },
      });
    }

    return json({
      success: true,
      data: {
        totalAutofills: 0,
        totalAnalyses: 0,
        totalClassifications: 0,
        totalProfiles: 0,
        autofillsByDay: [],
        topFormTypes: [],
        languageDistribution: [],
        averageConfidence: 0,
      },
    });
  }

  if (path === '/analytics/track' && method === 'POST') {
    const body = await request.json() as { event?: string; metadata?: Record<string, unknown> };
    const kv = env.AUTOFILL_KV;
    if (kv && body.event) {
      const id = crypto.randomUUID();
      await kv.put(`track:${id}`, JSON.stringify({
        id,
        type: body.event,
        timestamp: new Date().toISOString(),
        metadata: body.metadata || {},
      }));
    }
    return json({ success: true });
  }

  // --- Settings ---
  if (path === '/settings' && method === 'GET') {
    const kv = env.AUTOFILL_KV;
    if (kv) {
      const data = await kv.get('user:settings');
      if (data) return json({ success: true, data: JSON.parse(data) });
    }
    return json({
      success: true,
      data: {
        defaultLanguage: 'auto',
        autoClassify: true,
        encryptProfiles: true,
        theme: 'light',
        notifications: true,
        maxProfiles: 20,
      },
    });
  }

  if (path === '/settings' && method === 'PUT') {
    const body = await request.json() as Record<string, unknown>;
    const kv = env.AUTOFILL_KV;
    if (kv) {
      await kv.put('user:settings', JSON.stringify(body));
    }
    return json({ success: true, data: body });
  }

  return json({ success: false, error: 'Not found' }, 404);
}

export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  return handleRequest(context.request, context.env);
}
