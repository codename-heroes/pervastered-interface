# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Updater'
        db.create_table('Logger_updater', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=300)),
            ('namespace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['Logger.Namespace'])),
            ('rate', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('date', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('Logger', ['Updater'])

        # Adding M2M table for field involved_info on 'Updater'
        db.create_table('Logger_updater_involved_info', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('updater', models.ForeignKey(orm['Logger.updater'], null=False)),
            ('infograbber', models.ForeignKey(orm['Logger.infograbber'], null=False))
        ))
        db.create_unique('Logger_updater_involved_info', ['updater_id', 'infograbber_id'])

        # Adding M2M table for field triggers on 'Updater'
        db.create_table('Logger_updater_triggers', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('updater', models.ForeignKey(orm['Logger.updater'], null=False)),
            ('trigger', models.ForeignKey(orm['Logger.trigger'], null=False))
        ))
        db.create_unique('Logger_updater_triggers', ['updater_id', 'trigger_id'])

        # Adding unique constraint on 'Updater', fields ['name', 'namespace']
        db.create_unique('Logger_updater', ['name', 'namespace_id'])

        # Adding model 'InfoGrabber'
        db.create_table('Logger_infograbber', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=300)),
            ('url', self.gf('django.db.models.fields.URLField')(max_length=200)),
            ('content', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('namespace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['Logger.Namespace'])),
            ('method', self.gf('django.db.models.fields.CharField')(default='GET', max_length=300)),
        ))
        db.send_create_signal('Logger', ['InfoGrabber'])

        # Adding unique constraint on 'InfoGrabber', fields ['name', 'namespace']
        db.create_unique('Logger_infograbber', ['name', 'namespace_id'])


    def backwards(self, orm):
        # Removing unique constraint on 'InfoGrabber', fields ['name', 'namespace']
        db.delete_unique('Logger_infograbber', ['name', 'namespace_id'])

        # Removing unique constraint on 'Updater', fields ['name', 'namespace']
        db.delete_unique('Logger_updater', ['name', 'namespace_id'])

        # Deleting model 'Updater'
        db.delete_table('Logger_updater')

        # Removing M2M table for field involved_info on 'Updater'
        db.delete_table('Logger_updater_involved_info')

        # Removing M2M table for field triggers on 'Updater'
        db.delete_table('Logger_updater_triggers')

        # Deleting model 'InfoGrabber'
        db.delete_table('Logger_infograbber')


    models = {
        'Logger.event': {
            'Meta': {'object_name': 'Event'},
            'date': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'info': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'involved_objects': ('django.db.models.fields.related.ManyToManyField', [], {'blank': 'True', 'related_name': "'events'", 'null': 'True', 'symmetrical': 'False', 'to': "orm['Logger.LogObject']"}),
            'namespace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Namespace']"}),
            'tag': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'trigger': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Trigger']", 'null': 'True', 'blank': 'True'}),
            'type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.EventType']"})
        },
        'Logger.eventtype': {
            'Meta': {'unique_together': "(('name', 'namespace'),)", 'object_name': 'EventType'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'namespace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Namespace']"})
        },
        'Logger.infograbber': {
            'Meta': {'unique_together': "(('name', 'namespace'),)", 'object_name': 'InfoGrabber'},
            'content': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'method': ('django.db.models.fields.CharField', [], {'default': "'GET'", 'max_length': '300'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'namespace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Namespace']"}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '200'})
        },
        'Logger.logobject': {
            'Meta': {'unique_together': "(('external_identifier', 'namespace'),)", 'object_name': 'LogObject'},
            'external_identifier': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'info': ('django.db.models.fields.CharField', [], {'max_length': '300', 'null': 'True', 'blank': 'True'}),
            'namespace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Namespace']"})
        },
        'Logger.namespace': {
            'Meta': {'object_name': 'Namespace'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'info': ('django.db.models.fields.CharField', [], {'max_length': '300', 'null': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '100'})
        },
        'Logger.trigger': {
            'Meta': {'object_name': 'Trigger'},
            'evaluator': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'namespace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Namespace']"})
        },
        'Logger.triggererror': {
            'Meta': {'object_name': 'TriggerError'},
            'context': ('django.db.models.fields.TextField', [], {}),
            'date': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'error': ('django.db.models.fields.TextField', [], {}),
            'evaluator': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'trigger': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Trigger']"})
        },
        'Logger.updater': {
            'Meta': {'unique_together': "(('name', 'namespace'),)", 'object_name': 'Updater'},
            'date': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'involved_info': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'updaters'", 'symmetrical': 'False', 'to': "orm['Logger.InfoGrabber']"}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            'namespace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['Logger.Namespace']"}),
            'rate': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'triggers': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'updaters'", 'symmetrical': 'False', 'to': "orm['Logger.Trigger']"})
        }
    }

    complete_apps = ['Logger']