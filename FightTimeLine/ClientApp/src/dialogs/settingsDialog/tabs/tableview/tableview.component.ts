import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms"
import { IGameService } from "src/services/game.service-interface";
import { gameServiceToken } from "src/services/game.service-provider";
import { ISettings } from "src/services/SettingsService";
import { ISettingTab } from "../tabs";


@Component({
  selector: "settingsDialogTableviewTab",
  templateUrl: "./tableview.component.html",
  styleUrls: ["./tableview.component.css"]
})

export class SettingsDialogTableviewTab implements OnInit, ISettingTab {

  
  public tableViewForm: FormGroup;  

  constructor(    
    private formBuilder: FormBuilder,
    @Inject(gameServiceToken) public gameService: IGameService) {

  }

  ngOnInit() {

    
    this.tableViewForm = this.formBuilder.group({}, {});
    
  }

  get tvf() { return this.tableViewForm.controls; }

  

  updateResult(settings: ISettings): void {
  
  }
}
