const vscode = require('vscode')
const Knex = require('knex')
const noty = require('../../../lib/vscode-utils/noty')
const untitledFile = require('../../../lib/vscode-utils/untitled-file')

class KnexConnection {
  constructor(clientName, knexClient, name, connection, useNullAsDefault) {
    this.clientName = clientName
    this.clientType = knexClient
    this.name = name
    this.options = connection
    this.client = Knex({
      client: knexClient,
      connection,
      useNullAsDefault,
      acquireConnectionTimeout: 10000,
      pool: { min: 0, max: 1 }
    })
  }
  
  async fieldList(schemaName, tableName) {
    const fields = await this._fieldList(schemaName, tableName)
    this.fields = fields // 保存最新的 fields
    return fields
  }
  formatInput(records) {
    const dateNames = this.fields
      .filter(f => f.ppzType == 'datetime-ts')
      .map(f => f.name)
    for(let record of records)
      for(let name of dateNames)
        if((record[name] !== '') && (typeof record[name] == 'string'))
          record[name] = new Date(record[name])
  }

  getTarget(schema, table) {
    return '`' + schema + '`.`' + table + '`'
  }

  getCount(count) {
    return count[0]['count(*)']
  }
  async select(schema, table, { page, fields = ['*'], }) {
    console.debug('sql select', { schema, table })
    const records = await this._queryBuilder(schema, table)
      .select(...fields)
      .offset((page.index - 1) * page.size).limit(page.size)
    const count = await this._queryBuilder(schema, table).count()
    return {
      records,
      count: this.getCount(count)
    }
  }

  async insert(db, tb, record) {
    this.formatInput([record])
    return await this._queryBuilder(db, tb).insert(record)
  }

  _queryBuilder(schema, table) {
    if(schema)
      table = schema + '.' + table
    return this.client.from(table)
  }

  async updateMany(db, tb, changedList) {
    this.formatInput(changedList.map(item => item.changed))
    const table = db? db + '.' + tb : tb
    return await this.client.transaction(trx =>
      Promise.all(changedList.map(
        item => trx(table).where(item.pk).update(item.changed)
      ))
    )
  }

  async drop(db, tb, where) {
    if(Object.keys(where).length == 0)
      throw Error('deleting all data?')
    return this._queryBuilder(db, tb).where(where).del()
  }

  async close() {
    console.debug('connection closing...', this.name)
    await this.client.destroy()
    console.debug('connection closed')
  }

  terminal(...cmds) {
    const terminal = vscode.window.createTerminal()
    for(const cmd of cmds)
      terminal.sendText(cmd)
    terminal.show()
  }

  // Data Query Language
  async getDML2(schema, table) {
    const data = await this._queryBuilder(schema, table)
    // 下面的 queryBuilder 传入 null 是为了最终结果里不包含 schema 名称
    return this._queryBuilder(null, table).insert(data).toString() + ';\n'
  }
  async getDML(el) {
    if(el.isTable) {
      console.debug('导出数据', el.schemaName, el.name)
      return this.getDML2(el.schemaName, el.name)
    }
    const schemaName = getSchemaName(el)
    const tbList = await this.tbList(schemaName)
    console.debug('导出数据', el.name, tbList)
    let content = ''
    for(let tb of tbList)
      content += await this.getDML2(schemaName, tb)
    return content
  }
  async exportDML(el) {
    untitledFile.sql(await this.getDML(el))
  }

  async getDDL(el) {
    if(el.isTable) {
      console.debug('导出结构', el.schemaName, el.name)
      return this.getDDL2(el.schemaName, el.name)
    }
    const schemaName = getSchemaName(el)
    const tbList = await this.tbList(schemaName)
    console.debug('导出结构', el.name, tbList)
    let content = ''
    for(let tb of tbList)
      content += await this.getDDL2(schemaName, tb)
    return content
  }
  async exportDDL(el) {
    untitledFile.sql(await this.getDDL(el))
  }
  // DDL & DML
  async export(el) {
    untitledFile.sql(
      await this.getDDL(el),
      '\n',
      await this.getDML(el)
    )
  }
}

function getSchemaName(el) {
  if(el.isSqlite3Element)
    return null
  else if(el.isSchema)
    return el.name
  
  const msg = '导出数据失败，意料之外的元素类型'
  noty.fatal(msg)
  throw Error(msg)
}

module.exports = {
  KnexConnection,
  notyConnErr: err => {
    noty.error('连接失败，请检查连接信息或服务器 ' + err)
  }
}