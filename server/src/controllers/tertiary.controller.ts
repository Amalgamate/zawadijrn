import { Request, Response } from 'express';
import prisma from '../config/database';

// ==========================================
// Departments
// ==========================================
export const getDepartments = async (req: Request, res: Response) => {
    try {
        const departments = await prisma.tertiaryDepartment.findMany({
            include: { programs: true, units: true }
        });
        res.json({ success: true, data: departments });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createDepartment = async (req: Request, res: Response) => {
    try {
        const department = await prisma.tertiaryDepartment.create({
            data: req.body
        });
        res.status(201).json({ success: true, data: department });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateDepartment = async (req: Request, res: Response) => {
    try {
        const department = await prisma.tertiaryDepartment.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json({ success: true, data: department });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteDepartment = async (req: Request, res: Response) => {
    try {
        await prisma.tertiaryDepartment.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true, message: 'Department deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// Programs
// ==========================================
export const getPrograms = async (req: Request, res: Response) => {
    try {
        const programs = await prisma.tertiaryProgram.findMany({
            include: { department: true }
        });
        res.json({ success: true, data: programs });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createProgram = async (req: Request, res: Response) => {
    try {
        const program = await prisma.tertiaryProgram.create({
            data: req.body
        });
        res.status(201).json({ success: true, data: program });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateProgram = async (req: Request, res: Response) => {
    try {
        const program = await prisma.tertiaryProgram.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json({ success: true, data: program });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteProgram = async (req: Request, res: Response) => {
    try {
        await prisma.tertiaryProgram.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true, message: 'Program deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// Units
// ==========================================
export const getUnits = async (req: Request, res: Response) => {
    try {
        const units = await prisma.tertiaryUnit.findMany({
            include: { department: true }
        });
        res.json({ success: true, data: units });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createUnit = async (req: Request, res: Response) => {
    try {
        const unit = await prisma.tertiaryUnit.create({
            data: req.body
        });
        res.status(201).json({ success: true, data: unit });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateUnit = async (req: Request, res: Response) => {
    try {
        const unit = await prisma.tertiaryUnit.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json({ success: true, data: unit });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteUnit = async (req: Request, res: Response) => {
    try {
        await prisma.tertiaryUnit.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true, message: 'Unit deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
