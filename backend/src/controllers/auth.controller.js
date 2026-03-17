import "../config/env.js";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import {
    findUserByEmail,
    findRoleByName,
    createCompany,
    createUser,
} from "../models/auth.model.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { successResponse, errorResponse } from "../utils/response.js";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

function issueToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, companyId: user.company_id, isAdmin: user.is_admin },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

// POST /api/auth/register
// Creates company and user directly, returns JWT immediately.
export async function register(req, res) {
    try {
        const { companyName, email, password, economicSector, employeeCount } = req.body;

        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return errorResponse(res, "El correo ya está registrado.", 409);
        }

        const companyRole = await findRoleByName("client");
        if (!companyRole) {
            return errorResponse(res, "Rol 'client' no encontrado en la base de datos.", 500);
        }

        const passwordHash = await hashPassword(password);

        const companyId = await createCompany(companyName, economicSector, employeeCount);

        await createUser({
            email,
            passwordHash,
            roleId: companyRole.id,
            companyId,
            isAdmin: false,
        });

        const user = await findUserByEmail(email);
        const token = issueToken(user);

        return successResponse(
            res,
            "Empresa registrada exitosamente. Bienvenido a GreenNode.",
            {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.company_id,
                companyName: user.company_name,
                employeeCount: user.employee_count ?? null,
                economicSector: user.economic_sector ?? null,
                isAdmin: Boolean(user.is_admin),
            },
            201,
            { token }
        );
    } catch (error) {
        console.error("[register] Error:", error.message);
        return errorResponse(res, "Error al registrar la empresa.", 500, { detail: error.message });
    }
}

// POST /api/auth/login
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await findUserByEmail(email);
        if (!user) {
            return errorResponse(res, "Credenciales inválidas.", 401);
        }

        const passwordOk = await comparePassword(password, user.password_hash);
        if (!passwordOk) {
            return errorResponse(res, "Credenciales inválidas.", 401);
        }

        const token = issueToken(user);

        return successResponse(
            res,
            "Inicio de sesión exitoso.",
            {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.company_id,
                companyName: user.company_name,
                employeeCount: user.employee_count ?? null,
                economicSector: user.economic_sector ?? null,
                isAdmin: Boolean(user.is_admin),
            },
            200,
            { token }
        );
    } catch (error) {
        return errorResponse(res, "Error al iniciar sesión.", 500, { detail: error.message });
    }
}

// GET /api/auth/profile
export async function getProfile(req, res) {
    try {
        const result = await pool.query(
            `SELECT u.email, c.name AS company_name, c.economic_sector, c.employee_count,
                    COALESCE(SUM(q.tree_quantity), 0)::int AS total_trees_committed
             FROM app_user u
             LEFT JOIN company c ON c.id = u.company_id
             LEFT JOIN quote q ON q.company_id = c.id
             WHERE u.id = $1
             GROUP BY u.email, c.name, c.economic_sector, c.employee_count`,
            [req.user.id]
        );
        if (!result.rows[0]) return errorResponse(res, "Usuario no encontrado.", 404);
        return successResponse(res, "Perfil.", result.rows[0]);
    } catch (e) {
        return errorResponse(res, "Error obteniendo perfil.", 500, { detail: e.message });
    }
}
