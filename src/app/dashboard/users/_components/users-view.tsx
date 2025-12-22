"use client";

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
} from "@/components/ui/dialog";
import { useCreateUser, useUsers, useUpdateUser, useDeleteUser } from "@/lib/queries/users";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlusIcon, PencilIcon, TrashIcon } from "lucide-react";

type FormState = {
  full_name: string;
  email: string;
  password: string;
  role: "owner" | "admin" | "accountant" | "bookkeeper";
};

type EditFormState = {
  full_name: string;
  email: string;
  role: "owner" | "admin" | "accountant" | "bookkeeper";
};

const emptyFormState: FormState = {
  full_name: "",
  email: "",
  password: "",
  role: "accountant",
};

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-dark dark:text-white">
        {label}
        {required && <span className="text-red"> *</span>}
      </label>
      {children}
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index} className="text-base font-medium text-dark dark:text-white">
          <TableCell className="pl-5 sm:pl-6 xl:pl-7.5">
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

type UsersViewProps = {
  className?: string;
};

export function UsersView({ className }: UsersViewProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(emptyFormState);
  const [editFormState, setEditFormState] = useState<EditFormState | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const {
    data: users = [],
    isPending: isUsersLoading,
    isError,
    error,
  } = useUsers();

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const isSubmitting = createUser.isPending || updateUser.isPending;

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [users]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormState(emptyFormState);
    setFormError(null);
  };

  const closeEditForm = () => {
    setIsEditFormOpen(false);
    setEditFormState(null);
    setUserToEdit(null);
    setFormError(null);
  };

  const openEditForm = (user: User) => {
    setUserToEdit(user);
    setEditFormState({
      full_name: user.full_name || "",
      email: user.email || "",
      role: user.role as "owner" | "admin" | "accountant" | "bookkeeper",
    });
    setIsEditFormOpen(true);
    setFormError(null);
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!formState.full_name.trim()) {
      setFormError("Full name is required");
      return;
    }

    if (!formState.email.trim()) {
      setFormError("Email is required");
      return;
    }

    if (!formState.password.trim()) {
      setFormError("Password is required");
      return;
    }

    try {
      await createUser.mutateAsync({
        full_name: formState.full_name.trim(),
        email: formState.email.trim(),
        password: formState.password,
        role: formState.role,
      });

      toast.success("User created successfully", {
        description: `${formState.full_name} has been added.`,
      });

      closeForm();
    } catch (mutationError) {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Something went wrong. Please try again.";
      setFormError(message);
    }
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editFormState || !userToEdit) return;
    setFormError(null);

    if (!editFormState.full_name.trim()) {
      setFormError("Full name is required");
      return;
    }

    if (!editFormState.email.trim()) {
      setFormError("Email is required");
      return;
    }

    try {
      await updateUser.mutateAsync({
        id: userToEdit.id,
        full_name: editFormState.full_name.trim(),
        email: editFormState.email.trim(),
        role: editFormState.role,
      });

      toast.success("User updated successfully", {
        description: `${editFormState.full_name} has been updated.`,
      });

      closeEditForm();
    } catch (mutationError) {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Something went wrong. Please try again.";
      setFormError(message);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser.mutateAsync(userToDelete.id);

      toast.success("User deleted successfully", {
        description: `${userToDelete.full_name} has been removed.`,
      });

      closeDeleteDialog();
    } catch (mutationError) {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Something went wrong. Please try again.";
      toast.error("Failed to delete user", {
        description: message,
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "accountant":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "bookkeeper":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div
      className={cn(
        "rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">
            Users
          </h1>
          <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
            Manage users and their roles in your account.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setFormState(emptyFormState);
            setIsFormOpen(true);
            setFormError(null);
          }}
          className="inline-flex items-center gap-2"
        >
          <UserPlusIcon className="h-4 w-4" />
          New User
        </Button>
      </div>

      {(isError || formError) && (
        <div className="mb-4 rounded-lg border border-red/20 bg-red/10 px-4 py-3 text-sm text-red">
          {formError || error?.message || "Unable to load users right now."}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-none uppercase">
              <TableHead className="pl-5 sm:pl-6 xl:pl-7.5 !text-left">
                Name
              </TableHead>
              <TableHead className="!text-left">Email</TableHead>
              <TableHead className="!text-left">Role</TableHead>
              <TableHead className="!text-left">Created</TableHead>
              <TableHead className="!text-left">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isUsersLoading ? (
              <SkeletonRows />
            ) : sortedUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-gray-500 dark:text-dark-6"
                >
                  No users found. Create your first user to get started.
                </TableCell>
              </TableRow>
            ) : (
              sortedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="text-base font-medium text-dark dark:text-white"
                >
                  <TableCell className="pl-5 sm:pl-6 xl:pl-7.5">
                    {user.full_name || "N/A"}
                  </TableCell>
                  <TableCell>{user.email || "N/A"}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide",
                        getRoleBadgeColor(user.role),
                      )}
                    >
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(user)}
                        className="h-8 w-8"
                        title="Edit user"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(user)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Delete user"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog isOpen={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to your account with a specific role.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 py-4 lg:grid-cols-2">
              <FormField label="Full Name" required>
                <input
                  name="full_name"
                  type="text"
                  placeholder="John Doe"
                  value={formState.full_name}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  required
                />
              </FormField>

              <FormField label="Email" required>
                <input
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formState.email}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  required
                />
              </FormField>

              <FormField label="Password" required>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formState.password}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  required
                  minLength={6}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-dark-6">
                  Must be at least 6 characters with letters and numbers
                </p>
              </FormField>

              <FormField label="Role" required>
                <select
                  name="role"
                  value={formState.role}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                  required
                >
                  <option value="accountant">Accountant</option>
                  <option value="admin">Admin</option>
                  <option value="bookkeeper">Bookkeeper</option>
                  <option value="owner">Owner</option>
                </select>
              </FormField>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg border border-red/20 bg-red/10 px-4 py-3 text-sm text-red">
                {formError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog isOpen={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role.
            </DialogDescription>
          </DialogHeader>

          {editFormState && (
            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 gap-4 py-4 lg:grid-cols-2">
                <FormField label="Full Name" required>
                  <input
                    name="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={editFormState.full_name}
                    onChange={(e) =>
                      setEditFormState((prev) =>
                        prev ? { ...prev, full_name: e.target.value } : null
                      )
                    }
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    required
                  />
                </FormField>

                <FormField label="Email" required>
                  <input
                    name="email"
                    type="email"
                    placeholder="user@example.com"
                    value={editFormState.email}
                    onChange={(e) =>
                      setEditFormState((prev) =>
                        prev ? { ...prev, email: e.target.value } : null
                      )
                    }
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    required
                  />
                </FormField>

                <FormField label="Role" required>
                  <select
                    name="role"
                    value={editFormState.role}
                    onChange={(e) =>
                      setEditFormState((prev) =>
                        prev
                          ? {
                              ...prev,
                              role: e.target.value as
                                | "owner"
                                | "admin"
                                | "accountant"
                                | "bookkeeper",
                            }
                          : null
                      )
                    }
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                    required
                  >
                    <option value="accountant">Accountant</option>
                    <option value="admin">Admin</option>
                    <option value="bookkeeper">Bookkeeper</option>
                    <option value="owner">Owner</option>
                  </select>
                </FormField>
              </div>

              {formError && (
                <div className="mb-4 rounded-lg border border-red/20 bg-red/10 px-4 py-3 text-sm text-red">
                  {formError}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditForm}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update User"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {userToDelete?.full_name || userToDelete?.email}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={deleteUser.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

