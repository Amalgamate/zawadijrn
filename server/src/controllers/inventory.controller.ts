import { Request, Response } from 'express';
import inventoryService from '../services/inventory.service';

export class InventoryController {
    // CATEGORIES
    async createCategory(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const category = await inventoryService.createCategory(schoolId, req.body);
            res.json(category);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getCategories(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const categories = await inventoryService.getCategories(schoolId);
            res.json(categories);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // STORES
    async createStore(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const store = await inventoryService.createStore(schoolId, req.body);
            res.json(store);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getStores(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const stores = await inventoryService.getStores(schoolId);
            res.json(stores);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // ITEMS
    async createItem(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const item = await inventoryService.createItem(schoolId, req.body);
            res.json(item);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getItems(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const { categoryId } = req.query;
            const items = await inventoryService.getItems(schoolId, categoryId as string);
            res.json(items);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // MOVEMENTS
    async recordMovement(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const movement = await inventoryService.recordMovement(schoolId, {
                ...req.body,
                performedById: (req as any).user?.id
            });
            res.json(movement);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getMovements(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const movements = await inventoryService.getMovements(schoolId);
            res.json(movements);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // REQUISITIONS
    async createRequisition(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const userId = (req as any).user?.id;
            const requisition = await inventoryService.createRequisition(schoolId, userId, req.body);
            res.json(requisition);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateRequisitionStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const approvedById = (req as any).user?.id;
            const updated = await inventoryService.updateRequisitionStatus(id, status, approvedById);
            res.json(updated);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getRequisitions(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const requisitions = await inventoryService.getRequisitions(schoolId);
            res.json(requisitions);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    // ASSETS
    async registerAsset(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const asset = await inventoryService.registerFixedAsset(schoolId, req.body);
            res.json(asset);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async assignAsset(req: Request, res: Response) {
        try {
            const assignment = await inventoryService.assignAsset(req.body);
            res.json(assignment);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getAssetRegister(req: Request, res: Response) {
        try {
            const { schoolId } = req.params;
            const register = await inventoryService.getAssetRegister(schoolId);
            res.json(register);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export default new InventoryController();
