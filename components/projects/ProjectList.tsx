"use client";

import { useState } from "react";
import { Project } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { InteractiveButton } from "@/components/ui/interactive-button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Folder, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { createProject, deleteProject, updateProject } from "@/app/actions/projects";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectListProps {
    clientId: string;
    projects: (Project & { _count?: { invoices: number; expenses: number; quotes: number } })[];
}

export function ProjectList({ clientId, projects }: ProjectListProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;

        const result = await createProject({ name, description, clientId });

        if (result.success) {
            toast.success("Project created");
            setIsCreateOpen(false);
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setIsLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this project?")) return;
        const result = await deleteProject(id);
        if (result.success) {
            toast.success("Project deleted");
            router.refresh();
        } else {
            toast.error(result.error);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Projects</h3>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <InteractiveButton>
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </InteractiveButton>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Project</DialogTitle>
                            <DialogDescription>
                                Create a new project to track invoices and expenses.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate}>
                            <div className="grid gap-4 py-4">
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" name="name" required />
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea id="description" name="description" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? "Creating..." : "Create Project"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Invoices</TableHead>
                            <TableHead>Expenses</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No projects found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            projects.map((project) => (
                                <TableRow key={project.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Folder className="h-4 w-4 text-blue-500" />
                                            <div>
                                                <div>{project.name}</div>
                                                {project.description && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {project.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${project.status === "ACTIVE"
                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                            }`}>
                                            {project.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>{project._count?.invoices || 0}</TableCell>
                                    <TableCell>{project._count?.expenses || 0}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleDelete(project.id)} className="text-red-600">
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
