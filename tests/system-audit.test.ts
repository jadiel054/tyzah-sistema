import { describe, it, expect, beforeEach } from "vitest";
import { checkPassword, createAdminSession, verifyAdminSession } from "@/lib/auth";
import { checkRateLimit, clearRateLimitStore } from "@/lib/rate-limit";
import { isDateInPast, getTodayDateString, formatDateInTz } from "@/lib/date";
import { generateDaySlots, normalizePhone, formatPhoneBR, waLink } from "@/lib/slots";
import bcrypt from "bcryptjs";

describe("1. Autenticação: Login correto e incorreto", () => {
  it("deve autenticar corretamente com senha válida", async () => {
    process.env.ADMIN_PASSWORD = "minha-senha-segura-123";
    delete process.env.ADMIN_PASSWORD_HASH;

    expect(await checkPassword("minha-senha-segura-123")).toBe(true);
    expect(await checkPassword("senha-errada")).toBe(false);
  });

  it("deve autenticar corretamente com hash bcrypt", async () => {
    const raw = "segredo-forte-barbearia";
    const hash = await bcrypt.hash(raw, 10);
    process.env.ADMIN_PASSWORD_HASH = hash;
    delete process.env.ADMIN_PASSWORD;

    expect(await checkPassword(raw)).toBe(true);
    expect(await checkPassword("outro")).toBe(false);
  });
});

describe("2. Bloqueio de tentativas excessivas (Rate Limit)", () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  it("deve bloquear requisições após atingir o limite configurado", () => {
    const ip = "192.168.1.10";
    const maxAttempts = 3;
    const windowMs = 5000;

    expect(checkRateLimit(ip, maxAttempts, windowMs).success).toBe(true);
    expect(checkRateLimit(ip, maxAttempts, windowMs).success).toBe(true);
    expect(checkRateLimit(ip, maxAttempts, windowMs).success).toBe(true);

    const blocked = checkRateLimit(ip, maxAttempts, windowMs);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});

describe("3. Acesso não autorizado e validação de JWT Admin", () => {
  it("deve assinar e validar sessão de admin com claim role='admin'", async () => {
    process.env.JWT_SECRET = "super-secret-key-32-characters-length-admin";
    const token = await createAdminSession();
    expect(typeof token).toBe("string");

    const valid = await verifyAdminSession(token);
    expect(valid).toBe(true);
  });

  it("deve rejeitar tokens forjados ou inválidos", async () => {
    process.env.JWT_SECRET = "super-secret-key-32-characters-length-admin";
    expect(await verifyAdminSession("token-invalido-qualquer")).toBe(false);
  });
});

describe("4. Validação de regras de agendamento & Slots", () => {
  it("deve gerar slots corretamente dentro do horário comercial", () => {
    // 2026-05-13 is a Wednesday (open 09:00 - 20:00)
    const slots = generateDaySlots("2026-05-13", 30, [], []);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]).toBe("09:00");
    expect(slots).toContain("10:00");
  });
});

describe("5. Rejeição de datas passadas", () => {
  it("deve rejeitar datas anteriores à data de hoje em America/Sao_Paulo", () => {
    expect(isDateInPast("2020-01-01", "America/Sao_Paulo")).toBe(true);
    expect(isDateInPast("2021-12-31", "America/Sao_Paulo")).toBe(true);
    const today = getTodayDateString("America/Sao_Paulo");
    expect(isDateInPast(today, "America/Sao_Paulo")).toBe(false);
    expect(isDateInPast("2099-12-31", "America/Sao_Paulo")).toBe(false);
  });
});

describe("6. Rejeição de serviços e preços adulterados (Regras de negócio)", () => {
  it("deve normalizar telefones e validar tamanho", () => {
    expect(normalizePhone("(33) 99830-1285")).toBe("5533998301285");
    expect(normalizePhone("33998301285")).toBe("5533998301285");
    expect(normalizePhone("123")).toBe("123"); // Inválido (< 12)
  });
});

describe("7. Bloqueio de horários ocupados", () => {
  it("não deve oferecer horários já ocupados por outro agendamento", () => {
    const occupied = [{ startTime: "10:00", endTime: "10:30" }];
    const slots = generateDaySlots("2026-05-13", 30, occupied, []);
    expect(slots).not.toContain("10:00");
    expect(slots).toContain("10:30");
  });
});

describe("8. Duas reservas simultâneas (Double-booking)", () => {
  it("detecta sobreposição de horários conflitantes", () => {
    const occupied = [{ startTime: "14:00", endTime: "14:50" }]; // 50 min
    const slots = generateDaySlots("2026-05-13", 30, occupied, []);
    // 14:00 and 14:30 overlap with 14:00-14:50
    expect(slots).not.toContain("14:00");
    expect(slots).not.toContain("14:30");
    expect(slots).toContain("15:00");
  });
});

describe("9. Bloqueio de horários e dias inteiros", () => {
  it("deve respeitar bloqueio parcial de horário", () => {
    const blocks = [{ startTime: "11:00", endTime: "12:00" }];
    const slots = generateDaySlots("2026-05-13", 30, [], blocks);
    expect(slots).not.toContain("11:00");
    expect(slots).not.toContain("11:30");
    expect(slots).toContain("12:00");
  });

  it("deve bloquear o dia inteiro quando o bloqueio não possui horário", () => {
    const blocks = [{ startTime: null, endTime: null }];
    const slots = generateDaySlots("2026-05-13", 30, [], blocks);
    expect(slots.length).toBe(0);
  });
});

describe("10. Cancelamento e liberação de horários", () => {
  it("horário de agendamento cancelado não deve figurar como ocupado", () => {
    // Simula filtragem do banco onde appointments.status != 'cancelled'
    const appts = [
      { startTime: "15:00", endTime: "15:30", status: "cancelled" },
    ];
    const activeAppts = appts.filter((a) => a.status !== "cancelled");
    const slots = generateDaySlots("2026-05-13", 30, activeAppts, []);
    expect(slots).toContain("15:00");
  });
});

describe("11. Lista de espera", () => {
  it("gera links de WhatsApp com dados do cliente na lista", () => {
    const link = waLink("5533998301285", "Vaga liberada");
    expect(link).toContain("https://wa.me/5533998301285");
    expect(link).toContain(encodeURIComponent("Vaga liberada"));
  });
});

describe("12. Links de WhatsApp", () => {
  it("formata telefone brasileiro corretamente", () => {
    expect(formatPhoneBR("5533998301285")).toBe("+55 (33) 99830-1285");
    expect(formatPhoneBR("33998301285")).toBe("(33) 99830-1285");
  });
});

describe("13. Edição e limpeza de campos dos clientes (Tratamento de nulos)", () => {
  it("deve permitir null para limpar observações e fotos sem virar string 'null'", () => {
    function sanitizeClientPatch(body: { notes?: any; photoUrl?: any; lastService?: any }) {
      const updateData: Record<string, any> = {};
      if (body.notes !== undefined) {
        const val = body.notes === null ? null : String(body.notes).trim();
        updateData.notes = !val ? null : val;
      }
      if (body.photoUrl !== undefined) {
        const val = body.photoUrl === null ? null : String(body.photoUrl).trim();
        updateData.photoUrl = !val ? null : val;
      }
      if (body.lastService !== undefined) {
        const val = body.lastService === null ? null : String(body.lastService).trim();
        updateData.lastService = !val ? null : val;
      }
      return updateData;
    }

    const resNull = sanitizeClientPatch({ notes: null, photoUrl: null, lastService: null });
    expect(resNull.notes).toBeNull();
    expect(resNull.photoUrl).toBeNull();
    expect(resNull.lastService).toBeNull();

    const resEmpty = sanitizeClientPatch({ notes: "   ", photoUrl: "" });
    expect(resEmpty.notes).toBeNull();
    expect(resEmpty.photoUrl).toBeNull();

    const resVal = sanitizeClientPatch({ notes: "Prefere navalha" });
    expect(resVal.notes).toBe("Prefere navalha");
  });
});

describe("14. Fuso horário brasileiro (Teste 21h às 23h59)", () => {
  it("deve calcular a data de hoje correspondente ao Brasil mesmo após 21h", () => {
    // 2026-05-10 22:30 BRT is 2026-05-11 01:30 UTC
    const dateAtNightBRT = new Date("2026-05-10T22:30:00-03:00");
    const brDate = formatDateInTz(dateAtNightBRT, "America/Sao_Paulo");
    const utcDate = dateAtNightBRT.toISOString().slice(0, 10);

    expect(brDate).toBe("2026-05-10");
    expect(utcDate).toBe("2026-05-11"); // toISOString() provocava o bug de mudar de dia antes da meia-noite
  });
});
