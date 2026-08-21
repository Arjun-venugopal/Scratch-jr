import { Response } from 'express';
import Project from '../models/Project';
import { AuthRequest } from '../middlewares/auth';

/**
 * GET /api/v1/projects
 * Returns all projects belonging to the authenticated user.
 */
export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const projects = await Project.find({ ownerId: req.user?._id }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/v1/projects
 * Creates a new project for the authenticated user.
 */
export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { title, projectData } = req.body;

    if (!title) {
      res.status(400).json({ message: 'Project title is required' });
      return;
    }

    const project = new Project({
      ownerId: req.user?._id,
      title,
      projectData: projectData || {},
    });
    const savedProject = await project.save();
    res.status(201).json(savedProject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/v1/projects/:id
 * Returns a single project if the user owns it.
 */
export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (project && project.ownerId.toString() === req.user?._id?.toString()) {
      res.json(project);
    } else {
      res.status(404).json({ message: 'Project not found or unauthorized' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/v1/projects/:id
 * Updates an existing project if the user owns it.
 */
export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (project.ownerId.toString() !== req.user?._id?.toString()) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    const { title, projectData, isPublic } = req.body;
    if (title !== undefined) project.title = title;
    if (projectData !== undefined) project.projectData = projectData;
    if (isPublic !== undefined) project.isPublic = isPublic;

    const updated = await project.save();
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/v1/projects/:id
 * Deletes a project if the user owns it.
 */
export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (project.ownerId.toString() !== req.user?._id?.toString()) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
