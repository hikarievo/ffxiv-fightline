import { Component, Inject, Input, OnInit } from "@angular/core";
import { EachRowOneSecondTemplate } from "../../core/ExportTemplates/EachRowOneSecondTemplate"
import { BossAttackDefensiveTemplateV2 } from "../../core/ExportTemplates/BossAttackDefensiveTemplate"
import { ExportTemplate } from "../../core/BaseExportTemplate"
import { NzModalRef } from "ng-zorro-antd/modal";
import { DescriptiveTemplate } from "src/core/ExportTemplates/DescriptiveTemplate";
import { ExportData, IExportCell, IExportColumn, IExportResultSet, IExportRow, ITableOptions, ITableOptionSettings, NumberRangeOptionsSetting, TableOptionSettingType, TagsOptionsSetting } from "src/core/ExportModels";
import { PresenterManager } from "src/core/PresentationManager";
import { gameServiceToken } from "src/services/game.service-provider";
import { IGameService } from "src/services/game.service-interface";
import { MitigationsTemplate } from "src/core/ExportTemplates/MitigationsTemplate";
import { VisStorageService } from "src/services/VisStorageService";
import * as _ from "lodash"


@Component({
  selector: "tableViewDialog",
  templateUrl: "./tableViewDialog.component.html",
  styleUrls: ["./tableViewDialog.component.css"]
})
export class TableViewDialog implements OnInit {


  pagesize = Number.MAX_VALUE;
  ngOnInit() {
  }

  @Input("data")
  data: ExportData;
  presenterManager = new PresenterManager();

  selectedValue = null;

  set: IExportResultSet = {
    rows: [],
    columns: [],
    title: "",
    filterByFirstEntry: false
  };
  loading = false;
  templates: ExportTemplate<any>[] = [
    new EachRowOneSecondTemplate(),
    new BossAttackDefensiveTemplateV2(),
    new DescriptiveTemplate(),
    new MitigationsTemplate()
  ];

  options: ITableOptionSettings;
  currentOptions: ITableOptions;

  constructor(
    public dialogRef: NzModalRef,
    private visStorage: VisStorageService,
    @Inject(gameServiceToken) private gameService: IGameService,
  ) {
  }

  get showicon(): boolean {
    return this.currentOptions["cellOptions"].indexOf("icon") >= 0;
  };
  get showoffset(): boolean {
    return this.currentOptions["cellOptions"].indexOf("offset") >= 0;
  }

  get showtext(): boolean {
    return this.currentOptions["cellOptions"].indexOf("text") >= 0;
  }

  get showtarget(): boolean {
    return this.currentOptions["cellOptions"].indexOf("target") >= 0;
  }

  get iconSize(): number {
    return this.currentOptions["iconSize"];
  }

  show(fromOptionsChange?: boolean) {
    if (!this.selectedValue) return;

    this.loading = true;

    setTimeout(() => {

      const tpl = this.templates
        .find(it => it.name === this.selectedValue);

      if (!tpl) return;

      if (!fromOptionsChange) {
        const cellOptions: TagsOptionsSetting = {
          name: "cellOptions",
          "defaultValue": ["icon", "text", "target"],
          displayName: "Cell Options",
          type: TableOptionSettingType.Tags,
          description: "",
          options: {
            items: [
              { id: "icon", checked: true, text: "Icon" },
              { id: "text", checked: true, text: "Text" },
              { id: "offset", checked: false, text: "Offset" },
              { id: "target", checked: true, text: "Target" }
            ]
          }
        };

        const iconSize: NumberRangeOptionsSetting = {
          name: "iconSize",
          "defaultValue": 16,
          displayName: "Icon Size",
          type: TableOptionSettingType.NumberRange,
          description: "Changes size of icons",
          options: {
            min: 16,
            max: 48
          }
        };

        this.options = [...(tpl.loadOptions(this.data) || []), cellOptions, iconSize];
        this.currentOptions = this.options.reduce((acc, c) => {
          acc[c.name] = c.defaultValue;
          return acc;
        }, {})
      }

      const context = { data: this.data, presenter: this.presenterManager, jobRegistry: this.gameService.jobRegistry, options: this.currentOptions, holders: this.visStorage.holders };

      const d = tpl.buildTable(context);

      this.set = d;
      this.filterChange(null, null);
      this.loading = false;
    })

  }

  optionsChanged(values: ITableOptions) {
    this.currentOptions = values;
   
    // console.debug(filtered);
    this.show(true);
  }

  filtered: IExportRow[] = [];

  filterData = {};

  filterChange(event: any, column: string) {
    if (column) {
      this.filterData[column] = event;
    }
    const cellFilter = this.filterCell();
    this.filtered = this.set.rows.filter(row => {
      const visible = this.set.columns.every(c => {
        const v = !c.filterFn || !this.filterData[c.name] || c.filterFn(this.filterData[c.name], row, c)
        return v;
      });

      if (visible)
        row.cells.forEach((cell, index) => cellFilter(cell, this.filterData[this.set.columns[index].name]));

      return visible;
    });
  }

  filterCell() {
    let unique = new Set();
    const fn = (cell: IExportCell, data: string[]) => {
      cell.items.forEach(it => {
        it.visible = true
        if (it.filterFn && data && !it.filterFn(data)) {
          it.visible = false;
          return;
        }
        else {
          if (cell.disableUnique) return;
          if (!it.refId) return;
          if (unique.has(it.refId)) {
            it.visible = false;
          } else {
            it.visible = true;
            unique.add(it.refId)
          }
        }
      });
    };
    return fn;
  }

  trackByName(_: number, item: IExportColumn): string {
    return item.text;
  }

  onClose(): void {
    this.dialogRef.destroy();
  }
}
