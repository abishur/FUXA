import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatSort } from '@angular/material';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Utils } from '../../_helpers/utils';
import { Report, REPORT_PREFIX } from '../../_models/report';
import { ProjectService } from '../../_services/project.service';
import { ReportEditorComponent } from '../report-editor/report-editor.component';

@Component({
    selector: 'app-report-list',
    templateUrl: './report-list.component.html',
    styleUrls: ['./report-list.component.css']
})
export class ReportListComponent implements OnInit {

    displayedColumns = ['select', 'name', 'receiver', 'scheduling', 'type', 'enabled', 'create', 'remove'];
    dataSource = new MatTableDataSource([]);

    private subscriptionLoad: Subscription;

    @ViewChild(MatTable) table: MatTable<any>;
    @ViewChild(MatSort) sort: MatSort;

    constructor(public dialog: MatDialog,
        private translateService: TranslateService,
        private projectService: ProjectService) { }

    ngOnInit() {
        this.loadReports();
        this.subscriptionLoad = this.projectService.onLoadHmi.subscribe(res => {
            this.loadReports();
        });
    }

    ngAfterViewInit() {
        this.dataSource.sort = this.sort;
    }

    ngOnDestroy() {
        try {
            if (this.subscriptionLoad) {
                this.subscriptionLoad.unsubscribe();
            }
        } catch (e) {
        }
    }

    onAddReport() {
        this.editReport(new Report(Utils.getGUID(REPORT_PREFIX)), 1);
    }

    onEditReport(report: Report, toAdd: number) {
        this.editReport(report, 0);
    }

    onRemoveReport(report: Report) {
        this.editReport(report, -1);
    }

    editReport(report: Report, toAdd: number) {
        let dlgwidth = (toAdd < 0) ? 'auto' : '80%';
        let reports = this.dataSource.data.filter(s => s.id !== report.id);
		let mreport: Report = JSON.parse(JSON.stringify(report));
        let dialogRef = this.dialog.open(ReportEditorComponent, {
            data: { report: mreport, editmode: toAdd, reports: reports, devices: Object.values(this.projectService.getDevices()) },
            width: dlgwidth,
            position: { top: '80px' }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (toAdd < 0) {
                    this.projectService.removeReport(result).subscribe(result => {
                        this.loadReports();
                    });
				} else {
                    this.projectService.setReport(result, report).subscribe(() => {
                        this.loadReports();
                    });
                }
            }
        });
    }

    private loadReports() {
        this.dataSource.data = this.projectService.getReports();
    }
}
