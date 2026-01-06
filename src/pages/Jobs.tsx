import { useState } from 'react';
import { Plus, Search, Briefcase, Camera, Receipt, Navigation } from 'lucide-react';
import { Job, Client } from '@/types';
import { mockClients } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JobCard } from '@/components/jobs/JobCard';
import { JobDialog } from '@/components/jobs/JobDialog';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const mockJobs: Job[] = [
  {
    id: '1',
    clientId: '1',
    title: 'Kitchen Renovation',
    description: 'Complete kitchen remodel including cabinets and countertops',
    status: 'in_progress',
    photos: [],
    receipts: [],
    mileageEntries: [],
    createdAt: new Date('2024-12-01'),
  },
  {
    id: '2',
    clientId: '2',
    title: 'Bathroom Remodel',
    description: 'Master bathroom tile and fixtures',
    status: 'completed',
    photos: [],
    receipts: [],
    mileageEntries: [],
    createdAt: new Date('2024-11-20'),
    completedAt: new Date('2024-12-15'),
  },
];

export default function Jobs() {
  const [jobs, setJobs] = useLocalStorage<Job[]>('ceb-jobs', mockJobs);
  const [clients] = useLocalStorage<Client[]>('ceb-clients', mockClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const filteredJobs = jobs.filter((job) => {
    const client = clients.find((c) => c.id === job.clientId);
    return (
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleCreateJob = (jobData: Partial<Job>) => {
    const newJob: Job = {
      id: Date.now().toString(),
      clientId: jobData.clientId || '',
      title: jobData.title || '',
      description: jobData.description,
      status: 'pending',
      photos: [],
      receipts: [],
      mileageEntries: [],
      createdAt: new Date(),
    };
    setJobs((prev) => [...prev, newJob]);
    setIsDialogOpen(false);
  };

  const handleUpdateJob = (updatedJob: Job) => {
    setJobs((prev) => prev.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
  };

  const handleDeleteJob = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const pendingJobs = filteredJobs.filter((j) => j.status === 'pending');
  const inProgressJobs = filteredJobs.filter((j) => j.status === 'in_progress');
  const completedJobs = filteredJobs.filter((j) => j.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Track jobs with photos, receipts, and mileage
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Job
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Briefcase className="h-4 w-4" />
            <span className="text-sm">Active Jobs</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{inProgressJobs.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Camera className="h-4 w-4" />
            <span className="text-sm">Photos</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {jobs.reduce((sum, j) => sum + j.photos.length, 0)}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Receipt className="h-4 w-4" />
            <span className="text-sm">Receipts</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {jobs.reduce((sum, j) => sum + j.receipts.length, 0)}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Navigation className="h-4 w-4" />
            <span className="text-sm">Total Miles</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {jobs
              .reduce((sum, j) => sum + j.mileageEntries.reduce((m, e) => m + e.distance, 0), 0)
              .toFixed(1)}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No jobs found.</p>
          <Button variant="link" className="mt-2" onClick={() => setIsDialogOpen(true)}>
            Create your first job
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {inProgressJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">In Progress</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inProgressJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    client={clients.find((c) => c.id === job.clientId)}
                    onUpdate={handleUpdateJob}
                    onDelete={handleDeleteJob}
                  />
                ))}
              </div>
            </div>
          )}

          {pendingJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Pending</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    client={clients.find((c) => c.id === job.clientId)}
                    onUpdate={handleUpdateJob}
                    onDelete={handleDeleteJob}
                  />
                ))}
              </div>
            </div>
          )}

          {completedJobs.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Completed</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    client={clients.find((c) => c.id === job.clientId)}
                    onUpdate={handleUpdateJob}
                    onDelete={handleDeleteJob}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <JobDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        job={editingJob}
        clients={clients}
        onSave={handleCreateJob}
      />
    </div>
  );
}
