const adminMiddleware = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'No autorizado para acceder a esta ruta' });
    }
    next();
}

export default adminMiddleware;