import { PathExt } from '@jupyterlab/coreutils';
import {
  caretDownIcon,
  caretUpIcon,
  refreshIcon
} from '@jupyterlab/ui-components';
import * as React from 'react';
import { classes } from 'typestyle';
import { branchIcon, desktopIcon, pullIcon, pushIcon } from '../style/icons';
import {
  spacer,
  toolbarButtonClass,
  toolbarClass,
  toolbarMenuButtonClass,
  toolbarMenuButtonEnabledClass,
  toolbarMenuButtonIconClass,
  toolbarMenuButtonSubtitleClass,
  toolbarMenuButtonTitleClass,
  toolbarMenuButtonTitleWrapperClass,
  toolbarMenuWrapperClass,
  toolbarNavClass
} from '../style/Toolbar';
import { IGitExtension } from '../tokens';
import { ActionButton } from './ActionButton';
import { BranchMenu } from './BranchMenu';
import { CommandIDs } from '../gitMenuCommands';

/**
 * Interface describing component properties.
 */
export interface IToolbarProps {
  /**
   * Git extension data model.
   */
  model: IGitExtension;

  /**
   * Boolean indicating whether branching is disabled.
   */
  branching: boolean;

  /**
   * Callback to invoke in order to refresh a repository.
   *
   * @returns promise which refreshes a repository
   */
  refresh: () => Promise<void>;
}

/**
 * Interface describing component state.
 */
export interface IToolbarState {
  /**
   * Boolean indicating whether a branch menu is shown.
   */
  branchMenu: boolean;

  /**
   * Boolean indicating whether a repository menu is shown.
   */
  repoMenu: boolean;

  /**
   * Current repository.
   */
  repository: string;

  /**
   * Current branch name.
   */
  branch: string;
}

/**
 * React component for rendering a panel toolbar.
 */
export class Toolbar extends React.Component<IToolbarProps, IToolbarState> {
  /**
   * Returns a React component for rendering a panel toolbar.
   *
   * @param props - component properties
   * @returns React component
   */
  constructor(props: IToolbarProps) {
    super(props);

    const repo = this.props.model.pathRepository;

    this.state = {
      branchMenu: false,
      repoMenu: false,
      repository: repo || '',
      branch: repo ? this.props.model.currentBranch.name : ''
    };
  }

  /**
   * Callback invoked immediately after mounting a component (i.e., inserting into a tree).
   */
  componentDidMount(): void {
    this._addListeners();
  }

  /**
   * Callback invoked when a component will no longer be mounted.
   */
  componentWillUnmount(): void {
    this._removeListeners();
  }

  /**
   * Renders the component.
   *
   * @returns React element
   */
  render(): React.ReactElement {
    return (
      <div className={toolbarClass}>
        {this._renderTopNav()}
        {this._renderRepoMenu()}
        {this._renderBranchMenu()}
      </div>
    );
  }

  /**
   * Renders the top navigation.
   *
   * @returns React element
   */
  private _renderTopNav(): React.ReactElement {
    return (
      <div className={toolbarNavClass}>
        <span className={spacer} />
        <ActionButton
          className={toolbarButtonClass}
          icon={pullIcon}
          onClick={this._onPullClick}
          title={'Pull latest changes'}
        />
        <ActionButton
          className={toolbarButtonClass}
          icon={pushIcon}
          onClick={this._onPushClick}
          title={'Push committed changes'}
        />
        <ActionButton
          className={toolbarButtonClass}
          icon={refreshIcon}
          onClick={this._onRefreshClick}
          title={'Refresh the repository to detect local and remote changes'}
        />
      </div>
    );
  }

  /**
   * Renders a repository menu.
   *
   * @returns React element
   */
  private _renderRepoMenu(): React.ReactElement {
    return (
      <div className={toolbarMenuWrapperClass}>
        <button
          disabled
          className={toolbarMenuButtonClass}
          title={`Current repository: ${this.state.repository}`}
          onClick={this._onRepositoryClick}
        >
          <desktopIcon.react className={toolbarMenuButtonIconClass} />
          <div className={toolbarMenuButtonTitleWrapperClass}>
            <p className={toolbarMenuButtonTitleClass}>Current Repository</p>
            <p className={toolbarMenuButtonSubtitleClass}>
              {PathExt.basename(this.state.repository)}
            </p>
          </div>
        </button>
        {this.state.repoMenu ? null : null}
      </div>
    );
  }

  /**
   * Renders a branch menu.
   *
   * @returns React element
   */
  private _renderBranchMenu(): React.ReactElement | null {
    if (!this.state.repository) {
      return null;
    }
    return (
      <div className={toolbarMenuWrapperClass}>
        <button
          className={classes(
            toolbarMenuButtonClass,
            toolbarMenuButtonEnabledClass
          )}
          title={`Change the current branch: ${this.state.branch}`}
          onClick={this._onBranchClick}
        >
          <branchIcon.react className={toolbarMenuButtonIconClass} />
          <div className={toolbarMenuButtonTitleWrapperClass}>
            <p className={toolbarMenuButtonTitleClass}>Current Branch</p>
            <p className={toolbarMenuButtonSubtitleClass}>
              {this.state.branch}
            </p>
          </div>
          {this.state.branchMenu ? (
            <caretUpIcon.react className={toolbarMenuButtonIconClass} />
          ) : (
            <caretDownIcon.react className={toolbarMenuButtonIconClass} />
          )}
        </button>
        {this.state.branchMenu ? (
          <BranchMenu
            model={this.props.model}
            branching={this.props.branching}
          />
        ) : null}
      </div>
    );
  }

  /**
   * Adds model listeners.
   */
  private _addListeners(): void {
    // When the HEAD changes, decent probability that we've switched branches:
    this.props.model.headChanged.connect(this._syncState, this);

    // When the status changes, we may have checked out a new branch (e.g., via the command-line and not via the extension) or changed repositories:
    this.props.model.statusChanged.connect(this._syncState, this);
  }

  /**
   * Removes model listeners.
   */
  private _removeListeners(): void {
    this.props.model.headChanged.disconnect(this._syncState, this);
    this.props.model.statusChanged.disconnect(this._syncState, this);
  }

  /**
   * Syncs the component state with the underlying model.
   */
  private _syncState(): void {
    const repo = this.props.model.pathRepository;
    this.setState({
      repository: repo || '',
      branch: repo ? this.props.model.currentBranch.name : ''
    });
  }

  /**
   * Callback invoked upon clicking a button to pull the latest changes.
   *
   * @param event - event object
   */
  private _onPullClick = (): void => {
    const commands = this.props.model.commands;
    if (commands) {
      commands.execute(CommandIDs.gitPull);
    }
  };

  /**
   * Callback invoked upon clicking a button to push the latest changes.
   *
   * @param event - event object
   */
  private _onPushClick = (): void => {
    const commands = this.props.model.commands;
    if (commands) {
      commands.execute(CommandIDs.gitPush);
    }
  };

  /**
   * Callback invoked upon clicking a button to change the current repository.
   *
   * @param event - event object
   */
  private _onRepositoryClick = (): void => {
    // Toggle the repository menu:
    this.setState({
      repoMenu: !this.state.repoMenu
    });
  };

  /**
   * Callback invoked upon clicking a button to change the current branch.
   *
   * @param event - event object
   */
  private _onBranchClick = (): void => {
    // Toggle the branch menu:
    this.setState({
      branchMenu: !this.state.branchMenu
    });
  };

  /**
   * Callback invoked upon clicking a button to refresh a repository.
   *
   * @param event - event object
   */
  private _onRefreshClick = (): void => {
    this.props.refresh();
  };
}
