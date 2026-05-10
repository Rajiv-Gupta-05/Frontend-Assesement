import { Component, OnInit, ViewChild, ViewContainerRef, OnDestroy, Injector, createNgModule, ElementRef, AfterViewInit } from '@angular/core';
import { UserService, User } from '../../core/services/user.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  
  searchTerm = '';
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  isLoadingData = true;

  get endRecord() {
    return Math.min(this.currentPage * this.pageSize, this.filteredUsers.length);
  }

  private destroy$ = new Subject<void>();
  chartInstance: any;

  @ViewChild('formContainer', { read: ViewContainerRef }) formContainer!: ViewContainerRef;
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private userService: UserService, private injector: Injector) {}

  ngOnInit() {
    // Simulate initial data loading for better UX demonstration
    setTimeout(() => {
      this.userService.users$
        .pipe(takeUntil(this.destroy$))
        .subscribe(users => {
          this.users = users;
          this.isLoadingData = false;
          this.applyFilters();
          this.updateChartData();
        });
    }, 600);
  }

  ngAfterViewInit() {
    // Chart will initialize after data is loaded and DOM is ready
    if (!this.isLoadingData) {
      this.initChart();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  // --- Filtering & Pagination ---
  
  onSearchChange(event: any) {
    this.searchTerm = event.target.value;
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    if (this.searchTerm) {
      const lowerTerm = this.searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(u => 
        u.name.toLowerCase().includes(lowerTerm) || 
        u.email.toLowerCase().includes(lowerTerm) ||
        u.role.toLowerCase().includes(lowerTerm)
      );
    } else {
      this.filteredUsers = [...this.users];
    }
    
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    
    this.updatePagination();
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  // --- Modal & Chart ---

  async openAddUserForm() {
    this.formContainer.clear();
    const { UserFormModule } = await import('../user-form/user-form.module');
    const { UserFormComponent } = await import('../user-form/user-form.component');
    
    const moduleRef = createNgModule(UserFormModule, this.injector);
    const componentRef = this.formContainer.createComponent(UserFormComponent, { ngModuleRef: moduleRef });
    
    componentRef.instance.close.subscribe(() => {
      this.formContainer.clear();
    });
  }

  async initChart() {
    // Retry if canvas is not ready yet
    if (!this.chartCanvas) {
      setTimeout(() => this.initChart(), 100);
      return;
    }

    const { Chart, PieController, ArcElement, Tooltip, Legend } = await import('chart.js');
    Chart.register(PieController, ArcElement, Tooltip, Legend);

    const canvas = this.chartCanvas.nativeElement;
    this.chartInstance = new Chart(canvas, {
      type: 'pie',
      data: this.getChartData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  updateChartData() {
    if (this.chartInstance) {
      this.chartInstance.data = this.getChartData();
      this.chartInstance.update();
    } else if (!this.isLoadingData) {
      // Use setTimeout to wait for Angular's change detection to render the canvas
      setTimeout(() => {
        if (this.chartCanvas) {
          this.initChart();
        } else {
          // If still not available, retry shortly
          setTimeout(() => this.updateChartData(), 50);
        }
      });
    }
  }

  getChartData() {
    const roleCounts = this.users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: ['Admin', 'Editor', 'Viewer'],
      datasets: [{
        data: [roleCounts['Admin'] || 0, roleCounts['Editor'] || 0, roleCounts['Viewer'] || 0],
        backgroundColor: ['#1c4980', '#383838', '#7f8c8d']
      }]
    };
  }
}
